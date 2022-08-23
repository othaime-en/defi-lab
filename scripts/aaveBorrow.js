const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")

async function main() {
    await getWeth()

    // Interacting with the Aave protocol
    // abi/interface, contract address
    const { deployer } = await getNamedAccounts()

    // Lending Pool address provider address: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    // Lending Pool
    const lendingPool = await getLendingPool(deployer)
    console.log(`Lending Pool address: ${lendingPool.address}`)

    // now we have the lending pool address,
    // It is time to deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

    // Approve the lending pool to deposit
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing....")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("Deposited!!!")
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)
    const daiPrice = await getDaiPrice()
    const amountOfDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber()) // borrowing just 95% of what we can borrow
    console.log(`You can borrow ${amountOfDaiToBorrow} DAI`)
    const amountOfDaiToBorrowInWei = ethers.utils.parseEther(amountOfDaiToBorrow.toString())

    // Time to borrow
    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowDai(daiTokenAddress, lendingPool, amountOfDaiToBorrowInWei, deployer)
    await getBorrowUserData(lendingPool, deployer) // Showing the updated account data

    //Repaying the funds
    await repay(amountOfDaiToBorrowInWei, daiTokenAddress, lendingPool, deployer)
    await getBorrowUserData(lendingPool, deployer) // Showing the updated account data
}

// Function to repay
async function repay(amount, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool.address, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
    await repayTx.wait(1)
    console.log("Debt repaid!!!")
}

// Function to borrow
async function borrowDai(daiAddress, lendingPool, amountOfDaiToBorrowInWei, account) {
    const borrowTx = await lendingPool.borrow(daiAddress, amountOfDaiToBorrowInWei, 1, 0, account)
    await borrowTx.wait(1)
    console.log("You've borrowed!!")
}

// Getting the conversion rate of ETH/DAI so we know how much DAI we can borrow
async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

// We need to know how much we have borrowed, how much we have as collateral, and how much we can borrow
async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH.toString()} ETH in collateral`)
    console.log(`You have ${totalDebtETH.toString()} ETH in debt`)
    console.log(`You can borrow ${availableBorrowsETH.toString()} ETH`)

    return { totalCollateralETH, totalDebtETH, availableBorrowsETH }
}

// Takes a parameter: account = deployer
async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )

    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)

    return lendingPool
}

// Lets create an approve function
async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20 = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved the lending pool to deposit... ")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
