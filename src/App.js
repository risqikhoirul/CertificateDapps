import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams } from "react-router-dom";
import detectEthereumProvider from "@metamask/detect-provider";
import { PDFDownloadLink, Page, View, Text, Link, Document, StyleSheet, Image } from "@react-pdf/renderer";
import CertificateAuthenticatorContract from "./CertificateAuthenticator";

// src/index.js or src/App.js
import "bootstrap/dist/css/bootstrap.min.css";

const CONTRACT_ADDRESS = "0xA5213bEd16e5e9A4b3a1b52c840590cd4B89C16f";
// Mendaftarkan font sebelum menggunakannya

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20, // decrease margin
    color: "#007bff",
    borderBottom: 1, // add a bottom border
    paddingBottom: 10, // space between header and text
  },
  text: {
    fontSize: 14,
    marginBottom: 10,
    color: "#333",
  },
  boldText: {
    fontWeight: "bold",
  },
  italicText: {
    fontStyle: "italic",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  hashLink: {
    color: "#007bff",
    textDecoration: "none",
  },
});

const CertificatePDF = ({ ownerName, description, certificateHash }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <View>
          <Image style={styles.logo} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJIA0HNyD2vdIkcOgIFjHb5YimqWkDGLAbZywbmrhgeR-2Fz8uZ-AKEIIgvQ&s" />
          <Text style={styles.header}>Certificate of Achievement</Text>
        </View>
        <View>
          <Text style={styles.text}>This is to certify that</Text>
          <Text style={[styles.text, styles.boldText]}>{ownerName}</Text>
          <Text style={[styles.text, styles.italicText]}>has successfully completed the course on</Text>
          <Text style={[styles.text, styles.italicText]}>{description}</Text>
          <Text style={styles.text}>and has demonstrated exceptional skills and dedication.</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>
          Certificate Hash:{" "}
          <Link href={`http://localhost:3000/search/${certificateHash}`} style={styles.hashLink}>
            {certificateHash}
          </Link>
        </Text>
      </View>
    </Page>
  </Document>
);

function App() {
  const { hashId } = useParams();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [certificateHash, setCertificateHash] = useState("");
  const [searchHash, setSearchHash] = useState(hashId);
  const [searchResult, setSearchResult] = useState(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [error, setError] = useState(null);
  const [errorSearch, setErrorSearch] = useState(null);
  const [errorCreate, setErrorCreate] = useState(null);

  // const searchHashInputRef = useRef(null);

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
          setError("");
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
  }, [hashId]);

  const createCertificate = async () => {
    if (!contract) return setErrorCreate("Gagal Menambahkan Sertifikat");

    setErrorCreate("");

    const receipt = await contract.methods.createCertificate(ownerName, description).send({ from: account });

    const certificateHash = receipt.events.CertificateCreated.returnValues.certificateHash;
    setCertificateHash(certificateHash);
    setTransactionHash(receipt.transactionHash);
  };

  const searchCertificate = async () => {
    if (!contract) return;
    try {
      const result = await contract.methods.getCertificate(searchHash).call();
      setSearchResult({ ownerName: result[0], description: result[1] });
      setErrorSearch("");
    } catch (error) {
      console.error("Certificate not found");
      setErrorSearch("Certificate not found");
      setSearchResult(null);
    }
  };

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

  return (
    <>
      <div className="container mt-5">
        <h1 className="text-center mb-4">Certificate DApp</h1>
        <div className="mb-4">
          {!account ? (
            <div>
              <button className="btn btn-primary" onClick={connectWallet}>
                Connect Wallet
              </button>
              {error && <div className="text-danger mt-2">{error}</div>} {/* Menampilkan pesan kesalahan */}
            </div>
          ) : (
            <p className="text-success">Connected Wallet: {account}</p>
          )}
        </div>

        <div>
          <h2 style={styles.header}>Create Certificate</h2>
          <input className="form-control mb-2" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Name" />
          <input className="form-control mb-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <button className="btn btn-success mb-2" onClick={createCertificate}>
            Create Certificate
          </button>
          {errorCreate && <div className="text-danger mt-2">{error}</div>} {/* Menampilkan pesan kesalahan */}
          {certificateHash && (
            <div className="mt-2">
              <PDFDownloadLink document={<CertificatePDF ownerName={ownerName} description={description} certificateHash={certificateHash} />} fileName={`certificate_${ownerName}.pdf`}>
                {({ loading }) => (loading ? "Loading document..." : <button className="btn btn-outline-primary mb-2">Download Certificate</button>)}
              </PDFDownloadLink>
              <a className="btn btn-outline-secondary mb-2" href={`https://mumbai.polygonscan.com/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">
                View on polygonscan
              </a>
            </div>
          )}
        </div>

        <div>
          <h2 style={styles.header}>Search Certificate</h2>
          <input className="form-control mb-2" value={searchHash} onChange={(e) => setSearchHash(e.target.value)} placeholder="Certificate Hash" />
          <button className="btn btn-warning mt-2" onClick={searchCertificate}>
            Search Certificate
          </button>
          {errorSearch && <div className="text-danger mt-2">{errorSearch}</div>} {/* Menampilkan pesan kesalahan */}
          {searchResult && (
            <div
              className="mt-2"
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                width: "300px",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              <p style={styles.text}>
                <b>Owner:</b> {searchResult.ownerName}
              </p>
              <p style={styles.text}>
                <b>Description:</b> {searchResult.description}
              </p>
              <a className="btn btn-outline-secondary mb-2" href={`https://mumbai.polygonscan.com/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">
                View on polygonscan
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
