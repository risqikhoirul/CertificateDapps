import React, { useState, useEffect } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import CertificateAuthenticatorContract from "./CertificateAuthenticator";

// src/index.js or src/App.js
import "bootstrap/dist/css/bootstrap.min.css";

const CONTRACT_ADDRESS = "0xA5213bEd16e5e9A4b3a1b52c840590cd4B89C16f";

function Auth() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [address, setAddress] = useState("");
  const [deleteAddress, setDeleteAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionHashRem, setTransactionHashRem] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(CertificateAuthenticatorContract.abi, CONTRACT_ADDRESS);
        setContract(contractInstance);

        try {
          await window.ethereum.enable();
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
        } catch (error) {
          console.error("User denied account access");
          setError("User denied account access");
        }
      } else {
        console.error("Please install MetaMask");
        setError("Please install MetaMask");
      }
    };

    init();
  }, []);

  const connectWallet = async () => {
    if (web3) {
      try {
        await window.ethereum.enable();
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        setError("");
      } catch (error) {
        console.error("User denied account access");
        setError("User denied account access");
      }
    }
  };

  const createAuth = async () => {
    if (!contract) return console.log("Failed to add authorized address");

    try {
      const receipt = await contract.methods.addAuthorizedAddress(address).send({ from: account });
      setTransactionHash(receipt.transactionHash);
    } catch (error) {
      console.error("Failed to add authorized address:", error.message);
      setError("Failed to add authorized address");
    }
  };
  const deleteAuth = async () => {
    if (!contract) return console.log("Failed to add authorized address");

    try {
      const receipt = await contract.methods.removeAuthorizedAddress(deleteAddress).send({ from: account });
      setTransactionHashRem(receipt.transactionHash);
    } catch (error) {
      console.error("Failed to remove authorized address:", error.message);
      setError("Failed to remove authorized address");
    }
  };

  return (
    <>
      <div className="container mt-5">
        <h1 className="text-center mb-4">Authorization DApp</h1>
        <div className="mb-4">
          {!account ? (
            <div>
              <button className="btn btn-primary" onClick={connectWallet}>
                Connect Wallet
              </button>
              {error && <div className="text-danger mt-2">{error}</div>}
            </div>
          ) : (
            <p className="text-success">Connected Wallet: {account}</p>
          )}
        </div>

        <div>
          <h2>Create Authorization</h2>
          <input className="form-control mb-2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Authorized Address" />
          <button className="btn btn-success mb-2" onClick={createAuth}>
            Create Authorization
          </button>
          {transactionHash && (
            <div className="mt-2">
              <p>
                Transaction Hash:{" "}
                <a href={`https://mumbai.polygonscan.com/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">
                  {transactionHash}
                </a>
              </p>
            </div>
          )}
        </div>
        <div>
          <h2>Remove Authorization</h2>
          <input className="form-control mb-2" value={deleteAddress} onChange={(e) => setDeleteAddress(e.target.value)} placeholder="Authorized Address" />
          <button className="btn btn-success mb-2" onClick={deleteAuth}>
            Remove Authorization
          </button>
          {transactionHashRem && (
            <div className="mt-2">
              <p>
                Transaction Hash:{" "}
                <a href={`https://mumbai.polygonscan.com/tx/${transactionHashRem}`} target="_blank" rel="noopener noreferrer">
                  {transactionHashRem}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Auth;
