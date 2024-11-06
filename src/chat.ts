import { readFileSync } from "fs";
import Mustache from "mustache";

export async function Chat(
    web3: any,
    abiPath: string,
    address: string,
    templateString: string,
    username: string,
    req: Request,
): Promise<string> {
    const to = new URLSearchParams(new URL(req.url).search).get("username");
    let data: any;

    const deployedContent = readFileSync(address, "utf8");
    const abi = require(abiPath);

    const msgContract = new web3.eth.Contract(abi, deployedContent);

    const accounts = await web3.eth.getAccounts();
    const defaultAccount = accounts[0];

    let messageContent: string = "";
    try {
        messageContent =
            (await req.formData()).get("message")?.toString().trim() || // trim spaces
            "Hello from " + username;
    } catch (_) {
        data = {
            from: username,
            to,
        };
        return Mustache.render(templateString, data);
    }

    // If message is empty after trimming, don't send it.
    if (!messageContent) {
        data = {
            from: username,
            to,
            error: "Message cannot be empty or just spaces.",
        };
        return Mustache.render(templateString, data);
    }

    // Set the sender's username if not already set
    const senderUsername = await msgContract.methods
        .usernames(defaultAccount)
        .call();
    if (!senderUsername) {
        try {
            await msgContract.methods
                .setUsername(username)
                .send({ from: defaultAccount });
            console.log(`Username set for ${username}`);
        } catch (error) {
            console.error("Error setting username:", error);
            return "Error setting username.";
        }
    }

    // Fetch the recipient's username
    let recipientUsername = "";
    if (to) {
        try {
            recipientUsername = await msgContract.methods.usernames(to).call();
        } catch (error) {
            console.error("Error fetching recipient's username:", error);
            recipientUsername = to; // fallback to using the recipient's address if the username is not set
        }
    }

    // Send the message
    try {
        const sendMessageTx = await msgContract.methods
            .sendMessage(recipientUsername, messageContent)
            .send({ from: defaultAccount });
        console.log("Message sent successfully:", sendMessageTx);

        // Optionally, listen to the event emitted after the message is sent
        msgContract.events.MessageSent(
            { fromBlock: "latest" },
            (error: any, event: any) => {
                if (error) {
                    console.error("Error in event:", error);
                } else {
                    console.log("Message received in event:", event.returnValues);
                }
            },
        );
    } catch (error) {
        console.error("Error sending message:", error);
    }

    // Fetch the total number of messages
    const totalMessages = await msgContract.methods.getMessagesCount().call();

    // Fetch the previous messages for this user
    const previousMessages: any[] = await msgContract.methods.getMessages().call();

    // Prepare the message data
    data = {
        from: username,
        to,
        previous_messages: previousMessages,
        total_messages: totalMessages,
    };

    // Render the message template
    return Mustache.render(templateString, data);
}

