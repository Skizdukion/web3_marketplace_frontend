import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplace from "../constants/abi/NftMarketplace.json"
import nftAbi from "../constants/abi/BasicNft.json"
import nftAbi2 from "../constants/abi/BasicNftTwo.json"
import contractAddresses from "../constants/networkMapping.json"
import Image from "next/image"
import { Card, Input, Modal, useNotification } from "web3uikit"
import { ethers } from "ethers"

export default function UpdateListingModal({
    nftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
    price,
}) {
    const dispatch = useNotification()

    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(price)

    const handleUpdateListingSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Listing update successfully",
            title: "Updated - please refresh (and move blocks)",
            position: "topR",
        })
        onClose && onClose()
        setPriceToUpdateListingWith("")
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplace,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    })

    return (
        <div>
            <Modal
                isVisible={isVisible}
                onClose={onClose}
                onCloseButtonPressed={onClose}
                onCancel={onClose}
                onOk={() => {
                    updateListing({
                        onError: (error) => {
                            console.log(error)
                        },
                        onSuccess: handleUpdateListingSuccess,
                    })
                }}
            >
                <Input
                    label="Update listing price in L1 Currency"
                    name="New listing price"
                    type="number"
                    value={price}
                    onChange={(event) => {
                        setPriceToUpdateListingWith(event.target.value)
                    }}
                ></Input>
            </Modal>
        </div>
    )
}
