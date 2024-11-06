// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Messaging {

    // Mapping to store usernames
    mapping(address => string) public usernames;

    // Struct to represent a message
    struct Message {
        address from;           // Sender's address
        string from_username;   // Sender's username
        string to_username;     // Recipient's username
        string content;         // Message content (e.g., text of the message)
        uint256 timestamp;      // Timestamp of message
    }

    // Array to store all messages
    Message[] public messages;

    // Event to log when a message is sent
    event MessageSent(address indexed from, string from_username, string to_username, uint256 timestamp, string content);

    // Function to set the username for the sender
    function setUsername(string memory _username) public {
        require(bytes(_username).length > 0, "Username cannot be empty");
        usernames[msg.sender] = _username;
    }

    // Function to send a message
    function sendMessage(
        string memory _to_username, 
        string memory _content
    ) public {
        uint256 currentTime = block.timestamp;

        // Get the sender's address and username
        address sender = msg.sender;
        string memory from_username = usernames[sender];
        require(bytes(from_username).length > 0, "Sender must set a username first"); // Ensure sender has a username

        // Push new message to the messages array
        messages.push(Message({
            from: sender,              // Sender's address
            from_username: from_username,   // Sender's username
            to_username: _to_username,     // Recipient's username
            content: _content,         // Message content
            timestamp: currentTime     // Timestamp of message
        }));

        // Emit event for frontend to capture and display in real-time
        emit MessageSent(sender, from_username, _to_username, currentTime, _content);
    }

    // Function to get a specific message
    function getMessage(uint256 _index) public view returns (address, string memory, string memory, string memory, uint256) {
        Message memory msgObj = messages[_index];
        return (msgObj.from, msgObj.from_username, msgObj.to_username, msgObj.content, msgObj.timestamp);
    }

    // Function to get all messages (for frontend)
    function getMessages() public view returns (Message[] memory) {
        return messages;
    }

    // Function to get the total number of messages
    function getMessagesCount() public view returns (uint256) {
        return messages.length;
    }
}

