// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Register {

    // Struct for storing patient information
    struct Patient {
        string name;
        string image; // base64 encoded image
        string dob;   // date of birth in dd/mm/yyyy format
        string phoneNumber;
    }

    // Struct for storing doctor information
    struct Doctor {
        string username;
        string name;
        string image; // base64 encoded image
        string dob;   // date of birth in dd/mm/yyyy format
        string phoneNumber;
        string email;
        string education;
        string title;
    }

    // Mapping from address to Patient and Doctor
    mapping(address => Patient) public patients;
    mapping(address => Doctor) public doctors;

    // Events for logging patient and doctor registrations
    event PatientRegistered(address indexed patientAddress);
    event DoctorRegistered(address indexed doctorAddress);

    // Modifier to ensure only the contract creator can register doctors
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized.");
        _;
    }

    // Constructor to set the contract owner
    constructor() {
        owner = msg.sender;
    }

    // Function to register a patient
    function registerPatient(
        string memory _name,
        string memory _image,
        string memory _dob,
        string memory _phoneNumber
    ) public {
        // Register patient
        patients[msg.sender] = Patient({
            name: _name,
            image: _image,
            dob: _dob,
            phoneNumber: _phoneNumber
        });

        emit PatientRegistered(msg.sender);
    }

    // Function to register a doctor (only owner can register doctors)
    function registerDoctor(
        address _doctorAddress,
        string memory _username,
        string memory _name,
        string memory _image,
        string memory _dob,
        string memory _phoneNumber,
        string memory _email,
        string memory _education,
        string memory _title
    ) public onlyOwner {
        // Register doctor
        doctors[_doctorAddress] = Doctor({
            username: _username,
            name: _name,
            image: _image,
            dob: _dob,
            phoneNumber: _phoneNumber,
            email: _email,
            education: _education,
            title: _title
        });

        emit DoctorRegistered(_doctorAddress);
    }

    // Function to fetch the patient details by address
    function getPatient(address _patientAddress) public view returns (
        string memory name,
        string memory image,
        string memory dob,
        string memory phoneNumber
    ) {
        Patient memory patient = patients[_patientAddress];
        return (patient.name, patient.image, patient.dob, patient.phoneNumber);
    }

    // Function to fetch the doctor details by address
    function getDoctor(address _doctorAddress) public view returns (
        string memory username,
        string memory name,
        string memory image,
        string memory dob,
        string memory phoneNumber,
        string memory email,
        string memory education,
        string memory title
    ) {
        Doctor memory doctor = doctors[_doctorAddress];
        return (doctor.username, doctor.name, doctor.image, doctor.dob, doctor.phoneNumber, doctor.email, doctor.education, doctor.title);
    }
}
