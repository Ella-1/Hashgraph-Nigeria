const { 
    Client, 
    PrivateKey, 
    TokenCreateTransaction, 
    AccountCreateTransaction, 
    TokenAssociateTransaction, 
    TransferTransaction, 
    Hbar, 
    TokenType, 
    TokenSupplyType 
} = require("@hashgraph/sdk");
require('dotenv').config();

async function environmentSetup() {
    // Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    if (!myAccountId || !myPrivateKey) {
        throw new Error("Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be set");
    }

    // Create your Hedera Testnet client
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    // Define treasury account and key
    const treasuryId = myAccountId; 
    const treasuryKey = PrivateKey.fromString(myPrivateKey);

    // Define supply key (for token minting/burning)
    const supplyKey = PrivateKey.generateED25519();

    // Create a new account
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    const newAccountTx = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    const newAccountReceipt = await newAccountTx.getReceipt(client);
    const newAccountId = newAccountReceipt.accountId;

    console.log(`- New account created with ID: ${newAccountId}`);

    // Create a new token
    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("USD Bar")
        .setTokenSymbol("USDB")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(10000)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(supplyKey)
        .freezeWith(client);

    const tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
    const tokenCreateSubmit = await tokenCreateSign.execute(client);
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateRx.tokenId;

    console.log(`- Created token with ID: ${tokenId}`);

    // Associate the new account with the token
    const associateTx = await new TokenAssociateTransaction()
        .setAccountId(newAccountId)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(newAccountPrivateKey);

    const associateSubmit = await associateTx.execute(client);
    const associateReceipt = await associateSubmit.getReceipt(client);

    console.log(`- Token association with account ${newAccountId}: ${associateReceipt.status}`);

   // Transfer tokens to the new account
console.log(`Sending 100 tokens from treasury account (${treasuryId}) to new account (${newAccountId})...`);

const transferTx = await new TransferTransaction()
    .addTokenTransfer(tokenId, treasuryId, -100) // Treasury account sends 100 tokens
    .addTokenTransfer(tokenId, newAccountId, 100) // New account receives 100 tokens
    .execute(client);


    const transferReceipt = await transferTx.getReceipt(client);
    console.log(`- Token transfer status: ${transferReceipt.status}`);
}

environmentSetup();
