// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TraceBiogaz - Smart Contract de Traçabilité de Méthanisation & Crédits Carbone
 * @author BioGaz+ / SmartDigest Team (SIREXE Hackathon 2026)
 * @notice Enregistre de manière immuable les lots d'intrants de déchets organiques,
 *         les volumes de biogaz produits (CH4) et émet les certificats de crédits carbone associés.
 * @dev Conçu selon les standards de MRV (Mesure, Rapport et Vérification) Carbone.
 */

contract TraceBiogaz {
    // ------------------------------------------------------------------------
    // STRUCTURES DE DONNÉES
    // ------------------------------------------------------------------------

    struct WasteBatch {
        string batchId;              // Identifiant unique du lot (ex: "BATCH-2026-08-001")
        uint256 timestamp;            // Horodatage d'enregistrement (Unix timestamp)
        address operator;             // Adresse du gestionnaire du méthaniseur
        string substrateTypes;        // Types de déchets combinés (ex: "Fumier Bovin 60% + Manioc 40%")
        uint256 totalWasteKg;         // Poids total des intrants en kilogrammes
        uint256 biogasVolumeM3;       // Volume de biogaz produit (en m3)
        uint256 ch4PercentageBasis;   // Pureté en CH4 (ex: 6250 pour 62.50%)
        uint256 carbonCreditsTonsX1000; // Tonnes de CO2e évitées multipliées par 1000 pour précision
        bool isVerified;              // Validation par un auditeur MRV accrédité
        bytes32 dataHash;             // Hash cryptographique SHA256 des données capteurs IoT
    }

    struct CarbonCertificate {
        uint256 certificateId;
        string batchId;
        address beneficiary;
        uint256 amountKgCO2e;
        uint256 issuanceDate;
        bool isRetired;               // true si le crédit a été utilisé/compensé
    }

    // ------------------------------------------------------------------------
    // VARIABLES D'ÉTAT
    // ------------------------------------------------------------------------

    address public owner;
    uint256 public totalBatchesCount;
    uint256 public totalBiogasProducedM3;
    uint256 public totalCarbonCreditsIssuedKg;
    uint256 public nextCertificateId;

    // Table de correspondance : batchId => Données du lot
    mapping(string => WasteBatch) public batches;
    string[] public batchIdsList;

    // Rôles autorisés
    mapping(address => bool) public authorizedOperators;
    mapping(address => bool) public authorizedAuditors;

    // Registre des certificats carbone émis
    mapping(uint256 => CarbonCertificate) public certificates;

    // ------------------------------------------------------------------------
    // ÉVÉNEMENTS (LOGS BLOCKCHAIN)
    // ------------------------------------------------------------------------

    event BatchRegistered(
        string indexed batchId,
        address indexed operator,
        uint256 totalWasteKg,
        uint256 biogasVolumeM3,
        uint256 ch4PercentageBasis,
        uint256 carbonCreditsTonsX1000,
        bytes32 dataHash
    );

    event BatchVerified(
        string indexed batchId,
        address indexed auditor,
        uint256 timestamp
    );

    event CarbonCertificateMinted(
        uint256 indexed certificateId,
        string indexed batchId,
        address indexed beneficiary,
        uint256 amountKgCO2e
    );

    event CarbonCertificateRetired(
        uint256 indexed certificateId,
        address indexed owner,
        string reason
    );

    event OperatorStatusUpdated(address indexed operator, bool isAuthorized);
    event AuditorStatusUpdated(address indexed auditor, bool isAuthorized);

    // ------------------------------------------------------------------------
    // MODIFICATEURS D'ACCÈS
    // ------------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "TraceBiogaz: Reserve a l'administrateur");
        _;
    }

    modifier onlyOperator() {
        require(
            authorizedOperators[msg.sender] || msg.sender == owner,
            "TraceBiogaz: Operateur non autorise"
        );
        _;
    }

    modifier onlyAuditor() {
        require(
            authorizedAuditors[msg.sender] || msg.sender == owner,
            "TraceBiogaz: Auditeur MRV non autorise"
        );
        _;
    }

    // ------------------------------------------------------------------------
    // CONSTRUCTEUR
    // ------------------------------------------------------------------------

    constructor() {
        owner = msg.sender;
        authorizedOperators[msg.sender] = true;
        authorizedAuditors[msg.sender] = true;
        nextCertificateId = 1;
    }

    // ------------------------------------------------------------------------
    // GESTION DES RÔLES
    // ------------------------------------------------------------------------

    function setOperatorStatus(address _operator, bool _status) external onlyOwner {
        authorizedOperators[_operator] = _status;
        emit OperatorStatusUpdated(_operator, _status);
    }

    function setAuditorStatus(address _auditor, bool _status) external onlyOwner {
        authorizedAuditors[_auditor] = _status;
        emit AuditorStatusUpdated(_auditor, _status);
    }

    // ------------------------------------------------------------------------
    // FONCTION PRINCIPALE : ENREGISTREMENT D'UN LOT DE MÉTHANISATION
    // ------------------------------------------------------------------------

    /**
     * @notice Enregistre un lot traité par le digesteur et calcule les crédits carbone
     * @param _batchId ID unique du lot
     * @param _substrateTypes Descriptif des intrants
     * @param _totalWasteKg Quantité de déchets en kg
     * @param _biogasVolumeM3 Volume de biogaz en m3
     * @param _ch4PercentageBasis Taux de méthane en points de base (ex: 6000 pour 60.00%)
     * @param _dataHash Hash SHA256 des logs IoT de télémétrie
     */
    function registerBatch(
        string calldata _batchId,
        string calldata _substrateTypes,
        uint256 _totalWasteKg,
        uint256 _biogasVolumeM3,
        uint256 _ch4PercentageBasis,
        bytes32 _dataHash
    ) external onlyOperator returns (uint256 carbonCreditsTonsX1000) {
        require(bytes(batches[_batchId].batchId).length == 0, "TraceBiogaz: Lot deja existant");
        require(_totalWasteKg > 0, "TraceBiogaz: Tonnage invalide");
        require(_biogasVolumeM3 > 0, "TraceBiogaz: Volume biogaz nul");
        require(_ch4PercentageBasis >= 4000 && _ch4PercentageBasis <= 8500, "TraceBiogaz: Purete CH4 hors limites");

        // Calcul du volume de CH4 pur capté (en m3)
        // ch4Volume = (biogasVolume * ch4PercentageBasis) / 10000
        uint256 ch4VolumeM3 = (_biogasVolumeM3 * _ch4PercentageBasis) / 10000;

        // Calcul des Crédits Carbone selon la méthode UNFCCC ACM0022 :
        // ~2.15 kg CO2e évités par m3 de CH4 valorisé
        // Multiplié par 1000 pour obtenir des millièmes de tonnes (ou kg CO2e)
        // carbonCreditsKg = ch4VolumeM3 * 215 / 100
        uint256 carbonCreditsKg = (ch4VolumeM3 * 215) / 100;
        carbonCreditsTonsX1000 = carbonCreditsKg; // 1 kg = 0.001 tonne

        // Enregistrement du lot
        batches[_batchId] = WasteBatch({
            batchId: _batchId,
            timestamp: block.timestamp,
            operator: msg.sender,
            substrateTypes: _substrateTypes,
            totalWasteKg: _totalWasteKg,
            biogasVolumeM3: _biogasVolumeM3,
            ch4PercentageBasis: _ch4PercentageBasis,
            carbonCreditsTonsX1000: carbonCreditsTonsX1000,
            isVerified: false,
            dataHash: _dataHash
        });

        batchIdsList.push(_batchId);
        totalBatchesCount += 1;
        totalBiogasProducedM3 += _biogasVolumeM3;
        totalCarbonCreditsIssuedKg += carbonCreditsKg;

        emit BatchRegistered(
            _batchId,
            msg.sender,
            _totalWasteKg,
            _biogasVolumeM3,
            _ch4PercentageBasis,
            carbonCreditsTonsX1000,
            _dataHash
        );

        // Émission automatique du certificat de crédit carbone initial
        _mintCertificate(_batchId, msg.sender, carbonCreditsKg);

        return carbonCreditsTonsX1000;
    }

    // ------------------------------------------------------------------------
    // AUDIT ET VÉRIFICATION TIERS (MRV)
    // ------------------------------------------------------------------------

    function verifyBatch(string calldata _batchId) external onlyAuditor {
        require(bytes(batches[_batchId].batchId).length > 0, "TraceBiogaz: Lot introuvable");
        require(!batches[_batchId].isVerified, "TraceBiogaz: Lot deja certifie");

        batches[_batchId].isVerified = true;
        emit BatchVerified(_batchId, msg.sender, block.timestamp);
    }

    // ------------------------------------------------------------------------
    // GESTION DES CERTIFICATS CARBONE
    // ------------------------------------------------------------------------

    function _mintCertificate(
        string memory _batchId,
        address _beneficiary,
        uint256 _amountKgCO2e
    ) internal {
        uint256 certId = nextCertificateId++;
        certificates[certId] = CarbonCertificate({
            certificateId: certId,
            batchId: _batchId,
            beneficiary: _beneficiary,
            amountKgCO2e: _amountKgCO2e,
            issuanceDate: block.timestamp,
            isRetired: false
        });

        emit CarbonCertificateMinted(certId, _batchId, _beneficiary, _amountKgCO2e);
    }

    /**
     * @notice Permet à une entreprise ou collectivité de compenser son empreinte
     */
    function retireCertificate(uint256 _certId, string calldata _reason) external {
        CarbonCertificate storage cert = certificates[_certId];
        require(cert.certificateId > 0, "TraceBiogaz: Certificat inexistant");
        require(msg.sender == cert.beneficiary || msg.sender == owner, "TraceBiogaz: Non autorise");
        require(!cert.isRetired, "TraceBiogaz: Deja retire");

        cert.isRetired = true;
        emit CarbonCertificateRetired(_certId, msg.sender, _reason);
    }

    // ------------------------------------------------------------------------
    // LECTURE DES DONNÉES (VIEW FUNCTIONS)
    // ------------------------------------------------------------------------

    function getBatch(string calldata _batchId) external view returns (WasteBatch memory) {
        require(bytes(batches[_batchId].batchId).length > 0, "TraceBiogaz: Lot non trouve");
        return batches[_batchId];
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return batchIdsList;
    }

    function getSummaryStats() external view returns (
        uint256 count,
        uint256 totalBiogasM3,
        uint256 totalCreditsKgCO2e
    ) {
        return (totalBatchesCount, totalBiogasProducedM3, totalCarbonCreditsIssuedKg);
    }
}
