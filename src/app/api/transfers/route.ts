import { db } from "@/db";
import { fundTransfers, accounts, members } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const transfers = await db
      .select({
        id: fundTransfers.id,
        transferNumber: fundTransfers.transferNumber,
        memberId: fundTransfers.memberId,
        fromAccountId: fundTransfers.fromAccountId,
        toAccountId: fundTransfers.toAccountId,
        amount: fundTransfers.amount,
        transferType: fundTransfers.transferType,
        description: fundTransfers.description,
        referenceNumber: fundTransfers.referenceNumber,
        status: fundTransfers.status,
        processedBy: fundTransfers.processedBy,
        processedAt: fundTransfers.processedAt,
        createdAt: fundTransfers.createdAt,
      })
      .from(fundTransfers)
      .orderBy(desc(fundTransfers.createdAt));

    // Get account names for each transfer
    const transfersWithAccounts = await Promise.all(
      transfers.map(async (transfer) => {
        const fromAccount = await db
          .select({ accountName: accounts.accountName })
          .from(accounts)
          .where(eq(accounts.id, transfer.fromAccountId))
          .limit(1);
        
        const toAccount = await db
          .select({ accountName: accounts.accountName })
          .from(accounts)
          .where(eq(accounts.id, transfer.toAccountId))
          .limit(1);

        const member = transfer.memberId
          ? await db
              .select({ 
                firstName: members.firstName, 
                lastName: members.lastName 
              })
              .from(members)
              .where(eq(members.id, transfer.memberId))
              .limit(1)
          : null;

        return {
          ...transfer,
          fromAccountName: fromAccount[0]?.accountName || "Unknown",
          toAccountName: toAccount[0]?.accountName || "Unknown",
          memberName: member && member[0] 
            ? `${member[0].firstName} ${member[0].lastName}` 
            : null,
        };
      })
    );

    return Response.json(transfersWithAccounts);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return Response.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      memberId, 
      fromAccountId, 
      toAccountId, 
      amount, 
      transferType, 
      description, 
      referenceNumber,
      processedBy 
    } = body;

    if (!fromAccountId || !toAccountId || !amount || !transferType) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate transfer number
    const transferCount = await db.select({ id: fundTransfers.id }).from(fundTransfers);
    const transferNumber = `TRF-${String(transferCount.length + 1).padStart(6, "0")}`;

    // Check if from account has sufficient balance
    const fromAccount = await db
      .select({ balance: accounts.balance, accountName: accounts.accountName })
      .from(accounts)
      .where(eq(accounts.id, fromAccountId))
      .limit(1);

    if (!fromAccount[0]) {
      return Response.json({ error: "From account not found" }, { status: 404 });
    }

    if (fromAccount[0].balance < amount) {
      return Response.json(
        { error: `Insufficient balance in ${fromAccount[0].accountName}` },
        { status: 400 }
      );
    }

    // Create transfer record
    const newTransfer = await db.insert(fundTransfers).values({
      transferNumber,
      memberId: memberId || null,
      fromAccountId,
      toAccountId,
      amount,
      transferType,
      description: description || null,
      referenceNumber: referenceNumber || null,
      status: "completed",
      processedBy: processedBy || "System",
      processedAt: new Date(),
    }).returning();

    // Update account balances
    await db
      .update(accounts)
      .set({ balance: fromAccount[0].balance - amount })
      .where(eq(accounts.id, fromAccountId));

    const toAccount = await db
      .select({ balance: accounts.balance })
      .from(accounts)
      .where(eq(accounts.id, toAccountId))
      .limit(1);

    await db
      .update(accounts)
      .set({ balance: (toAccount[0]?.balance || 0) + amount })
      .where(eq(accounts.id, toAccountId));

    return Response.json(newTransfer[0], { status: 201 });
  } catch (error) {
    console.error("Error creating transfer:", error);
    return Response.json({ error: "Failed to create transfer" }, { status: 500 });
  }
}
