import { db } from "@/db";
import { schemes, schemeAccounts, accounts } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET() {
  try {
    const allSchemes = await db
      .select({
        id: schemes.id,
        schemeCode: schemes.schemeCode,
        schemeName: schemes.schemeName,
        description: schemes.description,
        schemeType: schemes.schemeType,
        contributionAmount: schemes.contributionAmount,
        contributionFrequency: schemes.contributionFrequency,
        isActive: schemes.isActive,
        startDate: schemes.startDate,
        endDate: schemes.endDate,
        createdAt: schemes.createdAt,
      })
      .from(schemes)
      .orderBy(desc(schemes.createdAt));

    // Get accounts for each scheme
    const schemesWithAccounts = await Promise.all(
      allSchemes.map(async (scheme) => {
        const schemeAccts = await db
          .select({
            id: schemeAccounts.id,
            accountId: schemeAccounts.accountId,
            accountRole: schemeAccounts.accountRole,
          })
          .from(schemeAccounts)
          .where(eq(schemeAccounts.schemeId, scheme.id));

        // Get account details including balance
        const accountsList = await Promise.all(
          schemeAccts.map(async (sa) => {
            const acct = await db
              .select({ 
                accountCode: accounts.accountCode,
                accountName: accounts.accountName,
                accountType: accounts.accountType,
                balance: accounts.balance,
              })
              .from(accounts)
              .where(eq(accounts.id, sa.accountId))
              .limit(1);
            return {
              ...sa,
              accountCode: acct[0]?.accountCode,
              accountName: acct[0]?.accountName,
              accountType: acct[0]?.accountType,
              balance: acct[0]?.balance || 0,
            };
          })
        );

        // Calculate total balance of linked accounts
        const totalBalance = accountsList.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        return {
          ...scheme,
          accounts: accountsList,
          totalBalance,
        };
      })
    );

    return Response.json(schemesWithAccounts);
  } catch (error) {
    console.error("Error fetching schemes:", error);
    return Response.json({ error: "Failed to fetch schemes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      schemeCode, 
      schemeName, 
      description, 
      schemeType, 
      contributionAmount,
      contributionFrequency,
      startDate,
      endDate,
      accounts: schemeAccountList 
    } = body;

    if (!schemeCode || !schemeName || !schemeType) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if scheme code already exists
    const existing = await db
      .select({ id: schemes.id })
      .from(schemes)
      .where(eq(schemes.schemeCode, schemeCode))
      .limit(1);

    if (existing[0]) {
      return Response.json(
        { error: "Scheme code already exists" },
        { status: 400 }
      );
    }

    // Create scheme
    const newScheme = await db.insert(schemes).values({
      schemeCode,
      schemeName,
      description: description || null,
      schemeType,
      contributionAmount: contributionAmount || 0,
      contributionFrequency: contributionFrequency || null,
      isActive: true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    }).returning();

    // Add accounts to scheme if provided
    if (schemeAccountList && schemeAccountList.length > 0) {
      for (const acct of schemeAccountList) {
        await db.insert(schemeAccounts).values({
          schemeId: newScheme[0].id,
          accountId: acct.accountId,
          accountRole: acct.accountRole,
        });
      }
    }

    return Response.json(newScheme[0], { status: 201 });
  } catch (error) {
    console.error("Error creating scheme:", error);
    return Response.json({ error: "Failed to create scheme" }, { status: 500 });
  }
}
