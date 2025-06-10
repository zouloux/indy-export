import { askQuestion, computePercentage, createFetch, downloadFile, loadEnvs, task, writeDataFile } from "./lib";

// Load env file
loadEnvs(".env")

// Get bearer from envs or ask to CLI
let bearer:string = process.env.INDY_AUTHORIZATION_BEARER ?? ""
if ( bearer.length === 0 ) {
	bearer = await askQuestion("Paste your Indy authorization bearer:\n");
	bearer = bearer.trim()
}

const apiBase = "https://app.indy.fr/api"
// Create fetchers
const fetchUser = () =>
	createFetch(`${apiBase}/users/me`, bearer)
const fetchTransactionPage = ( pageIndex:number ) =>
	createFetch(`${apiBase}/transactions/transactions-list?page=${pageIndex}`, bearer)
const fetchTransaction = ( transactionId:string ) =>
	createFetch(`${apiBase}/receipts/transaction?transactionId=${transactionId}`, bearer)
const fetchBankAuths = () =>
	createFetch(`${apiBase}/bank-connector/bank-auths`, bearer)
const fetchBankAccounts = () =>
	createFetch(`${apiBase}/bank-connector/bank-accounts?withAvailableBalanceInCents=true&withConnectorBankAccountStatus=true`, bearer)
const fetchSubscription = () =>
	createFetch(`${apiBase}/payment/subscription`, bearer)

// Get common data
await task("Fetching user", async () => {
	const user = await fetchUser()
	writeDataFile( "user.json", user )
})
await task("Fetching subscription", async () => {
	const user = await fetchSubscription()
	writeDataFile( "subscription.json", user )
})
await task("Fetching bank auths", async () => {
	const user = await fetchBankAuths()
	writeDataFile( "bank-auths.json", user )
})
await task("Fetching bank auths", async () => {
	const user = await fetchBankAccounts()
	writeDataFile( "bank-accounts.json", user )
})

// Get all transactions
let pageIndex = 1
let totalDownloadedTransactions = 0
// Loop until a run out of transactions in pages
while (true) {
	// Get this page
	const page = await task(
		`Fetching page ${pageIndex}`,
		() => fetchTransactionPage(pageIndex)
	)
	// Extract transactions
	const { transactions, nbTransactions } = page
	const transactionCount = transactions?.length ?? 0
	// End of pages
	if ( transactionCount === 0 )
		break;
	// Count total and compute percentage
	totalDownloadedTransactions += transactionCount
	const percentage = computePercentage(totalDownloadedTransactions, nbTransactions)
	console.log(`Progression: ${percentage}`)
	// Write this transaction page
	writeDataFile(`transaction-pages/page-${pageIndex}.json`, transactions)
	// Browse all transactions in this page
	for ( const transaction of transactions ) {
		// Get transaction object and save it
		const transactionObject = await fetchTransaction(transaction._id)
		writeDataFile(`transaction-objects/transaction-${transaction._id}.json`, transactionObject)
		// Get and browse receipts
		const receipts = transactionObject?.receipts ?? []
		const pairedReceipts = receipts.filter( (r:any) => r.pairingStatus === "PAIRED" )
		for ( const r of pairedReceipts ) {
			// Save PDFs
			const receiptBase = `receipts/${r._id}`
			let variableName = ""
			if ( r.format === "jpeg" || r.format === "jpg" || r.format === "png" ) {
				variableName = "image"
			}
			else if ( r.format === "pdf" ) {
				variableName = "pdf"
			}
			else {
				console.log("Invalid receipt format", r)
				process.exit(1)
			}
			const fileToDownload = r[variableName]
			if ( typeof fileToDownload !== "string" ) {
				console.log("Invalid receipt file", r)
				process.exit(1)
			}
			writeDataFile(`${receiptBase}/receipt.json`, r)
			await task(
				`Download receipt ${r._id}`,
				() => downloadFile(r.pdf, `./${receiptBase}/receipt.pdf`)
			)
		}
	}
	// Go to next page
	++pageIndex
}

console.log("All done")
process.exit()
