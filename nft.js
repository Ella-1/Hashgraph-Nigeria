const { 
    Client, 
    PrivateKey, 
    TokenCreateTransaction, 
    AccountCreateTransaction, 
    TokenAssociateTransaction, 
    TransferTransaction, 
    Hbar, 
    TokenType, 
    TokenSupplyType ,
    TokenMintTransaction
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

    //Create the NFT
    const nftCreate = await new TokenCreateTransaction()
    .setTokenName("diploma")
    .setTokenSymbol("GRAD")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(250)
    .setSupplyKey(supplyKey)
    .freezeWith(client);

    //Sign the transaction with the treasury key
    const nftCreateTxSign = await nftCreate.sign(treasuryKey);

    //Submit the transaction to a Hedera network
    const nftCreateSubmit = await nftCreateTxSign.execute(client);

    //Get the transaction receipt
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);

    //Get the token ID
    const tokenId = nftCreateRx.tokenId;

    //Log the token ID
    console.log("Created NFT with Token ID: " + tokenId);

    // Max transaction fee as a constant
const maxTransactionFee = new Hbar(20);

//IPFS content identifiers for which we will create a NFT
const CID = [
  Buffer.from(
    "ipfs://bafyreiao6ajgsfji6qsgbqwdtjdu5gmul7tv2v3pd6kjgcw5o65b2ogst4/metadata.json"
  ),
  Buffer.from(
    "ipfs://bafyreic463uarchq4mlufp7pvfkfut7zeqsqmn3b2x3jjxwcjqx6b5pk7q/metadata.json"
  ),
  Buffer.from(
    "ipfs://bafyreihhja55q6h2rijscl3gra7a3ntiroyglz45z5wlyxdzs6kjh2dinu/metadata.json"
  ),
  Buffer.from(
    "ipfs://bafyreidb23oehkttjbff3gdi4vz7mjijcxjyxadwg32pngod4huozcwphu/metadata.json"
  ),
  Buffer.from(
    "ipfs://bafyreie7ftl6erd5etz5gscfwfiwjmht3b52cevdrf7hjwxx5ddns7zneu/metadata.json"
  )
];
	
// MINT NEW BATCH OF NFTs
const mintTx = new TokenMintTransaction()
	.setTokenId(tokenId)
	.setMetadata(CID) //Batch minting - UP TO 10 NFTs in single tx
	.setMaxTransactionFee(maxTransactionFee)
	.freezeWith(client);

//Sign the transaction with the supply key
const mintTxSign = await mintTx.sign(supplyKey);

//Submit the transaction to a Hedera network
const mintTxSubmit = await mintTxSign.execute(client);

//Get the transaction receipt
const mintRx = await mintTxSubmit.getReceipt(client);

//Log the serial number
console.log("Created NFT " + tokenId + " with serial number: " + mintRx.serials);
}

environmentSetup();
