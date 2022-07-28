import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplace from "../constants/abi/NftMarketplace.json"
import nftAbi from "../constants/abi/BasicNft.json"
import nftAbi2 from "../constants/abi/BasicNftTwo.json"
import contractAddresses from "../constants/networkMapping.json"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "./UpdateListingModal"

const truncateStr = (fullStr, strLen) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."
    const seperatorLength = separator.length
    const charsToShow = strLen - seperatorLength
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return (
        fullStr.substring(0, frontChars) +
        separator +
        fullStr.substring(fullStr.length - backChars)
    )
}

export default function NFTBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {
    const [imgUri, setImgUri] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDesc, setTokenDesc] = useState("")
    const [showModal, setShowModal] = useState(false)
    const { chainId, isWeb3Enabled, account } = useMoralis()

    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const dispatch = useNotification()

    const basicNftContractArrayAddress = contractAddresses[chainString]["BasicNft"]
    const basicNftContractAddress =
        contractAddresses[chainString]["BasicNft"][basicNftContractArrayAddress.length - 1]
    const basicNftTwoContractArrayAddress = contractAddresses[chainString]["BasicNftTwo"]
    const basicNftTwoContractAddress =
        contractAddresses[chainString]["BasicNftTwo"][basicNftTwoContractArrayAddress.length - 1]

    let nftContractAbi

    if (basicNftContractAddress.toLowerCase() == nftAddress) {
        nftContractAbi = nftAbi
    }

    if (basicNftTwoContractAddress.toLowerCase() == nftAddress) {
        nftContractAbi = nftAbi2
    }

    const { runContractFunction: getTokenUri } = useWeb3Contract({
        abi: nftContractAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: buyListedItem } = useWeb3Contract({
        abi: nftMarketplace,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    async function updateUI() {
        const _tokenUri = await getTokenUri()
        if (_tokenUri) {
            const _requestURL = _tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
            const _tokenURIResponse = await (await fetch(_requestURL)).json()
            setTokenName(_tokenURIResponse.name)
            setTokenDesc(_tokenURIResponse.description)
            const _imgURI = _tokenURIResponse.image.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImgUri(_imgURI)
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const isOwnByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnByUser ? "you" : truncateStr(seller || "", 15)

    const handleBuyItemSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Buy item successfully",
            title: "Item Bought",
            position: "topR",
        })
    }

    const handleCardClick = () => {
        isOwnByUser
            ? setShowModal(true)
            : buyListedItem({
                  onError: (error) => {
                      console.log(error)
                  },
                  onSuccess: handleBuyItemSuccess,
              })
    }

    const closeModal = () => {
        setShowModal(false)
    }

    return (
        <div>
            {imgUri ? (
                <div>
                    <UpdateListingModal
                        isVisible={showModal}
                        tokenId={tokenId}
                        nftAddress={nftAddress}
                        marketplaceAddress={marketplaceAddress}
                        onClose={closeModal}
                        price={ethers.utils.formatUnits(price, "ether")}
                    />
                    <Card title={tokenName} description={tokenDesc} onClick={handleCardClick}>
                        <div className="flex flex-col items-end gap-2 p-2">
                            <div className="italic text-sm">Owned by {formattedSellerAddress}</div>
                            <Image
                                loader={() => imgUri}
                                src={imgUri}
                                height="200"
                                width="200"
                            ></Image>
                            <div className="font-bold">
                                {ethers.utils.formatUnits(price, "ether")} ETH
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div>Loading...</div>
            )}
        </div>
    )
}
