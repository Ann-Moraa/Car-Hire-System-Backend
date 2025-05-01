/*const express = require("express");
const router = express.Router();
const fs = require('fs');
const axios = require("axios");
const moment = require("moment");

// Assuming you have a validator middleware
const validator = require("../middlewares/validate");
// Import the new validation function
const validateStkPush = require("../validation/stkPushValidation");

const businessShortCode = '5343650';
const passkey = 'a847b4de631c15a873c9763c53c43c090a57115582b8e48eb3720cddd8439d84';
const consumerKey = "4IhJFHXCg7XHHDqGDJvyHsDS7AEsIDHgZO5uA81HGlILwh4u"
const consumerSecret = "pJYMh26ZCHO0lBHogG2sBvtcmNrYIbZygZV5GH6MVdHMGZrPA8PftIvSVSniBMSZ"

// Sample API route
router.get('/home', (req, res) => {
    res.json({ message: 'This is a sample API route.' });
    console.log("This is a sample API route.");
  });

  router.get("/access_token", (req, res) => {
    getAccessToken()
      .then((accessToken) => {
        res.json({ message: "😀 Your access token is " + accessToken });
      })
      .catch(console.log);
  });

  async function getAccessToken() {
    const url =
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const auth =
      "Basic " +
      new Buffer.from(consumerKey + ":" + consumerSecret).toString("base64");

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: auth,
        },
      });
      const accessToken = response.data.access_token;
      return accessToken;
    } catch (error) {
      throw error;
    }
  }

// Modify the STK Push route to use the validator middleware
router.post('/stkpush', validator(validateStkPush), async (req, res) => {
    console.log("--- STK Push POST handler started ---"); // <-- Clear start marker
    try {
        // Input validation is now handled by the middleware
        console.log("1. Input validation handled by middleware.");

        let phoneNumber = req.body.phone;
        const amount = req.body.amount;
        console.log(`2. Received phone: ${phoneNumber}, amount: ${amount}`);

        // The manual validation check is no longer needed here
        // if (!phoneNumber || !amount) { ... }

        console.log("5. Input validation passed (via middleware).");

        if (phoneNumber.startsWith("0")) {
          phoneNumber = "254" + phoneNumber.slice(1);
          console.log(`6. Formatted phone number: ${phoneNumber}`);
        } else {
          console.log("6. Phone number did not start with 0, using as is.");
        }

        console.log("7. Attempting to get access token...");
        const accessToken = await getAccessToken();
        console.log("8. Access token obtained.");

        const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + accessToken;
        const timestamp = moment().format("YYYYMMDDHHmmss");
        const password = new Buffer.from(
          businessShortCode +
          passkey +
          timestamp
        ).toString("base64");
        console.log("9. Password and timestamp generated.");

        console.log("10. Attempting to send STK Push request to Safaricom...");
        try {
            const response = await axios.post(
                url,
                {
                  BusinessShortCode: businessShortCode,
                  Password: password,
                  Timestamp: timestamp,
                  TransactionType: "CustomerPayBillOnline",
                  Amount: amount,
                  PartyA: phoneNumber,
                  PartyB: businessShortCode,
                  PhoneNumber: phoneNumber,
                  CallBackURL: `https://car-hire-system-backend.onrender.com/api/payment/callback`,
                  AccountReference: 'Car Hire Payment',
                  TransactionDesc: 'Payment for car hire',
                },
                {
                  headers: {
                    Authorization: auth,
                  },
                }
            );
            console.log("11. Received response from Safaricom.");
            console.log("12. Safaricom response data:", response.data);

            console.log("13. Sending 200 response to frontend.");
            res.status(200).json({
              msg: "STK Push request successful. Please check your phone to complete the transaction.",
              status: true,
              safaricomResponse: response.data
            });
            console.log("14. 200 response sent.");

        } catch (axiosError) {
            console.error("15. Error sending STK Push request to Safaricom:", axiosError.response ? axiosError.response.data : axiosError.message);
            console.log("16. Sending 500 response to frontend due to Safaricom error.");
            res.status(500).json({
              msg: "Failed to initiate STK Push",
              status: false,
              error: axiosError.response ? axiosError.response.data : axiosError.message
            });
            console.log("17. 500 response (axios error) sent.");
        }

    } catch (generalError) {
        console.error("18. An unexpected error occurred in /stkpush:", generalError);
        console.log("19. Sending 500 response to frontend due to general error.");
        res.status(500).json({
            msg: "An internal server error occurred.",
            status: false,
            error: generalError.message
        });
        console.log("20. 500 response (general error) sent.");
    }
    console.log("--- STK Push POST handler finished ---"); // <-- End marker (might not be reached)
});

  router.post("/callback", (req, res) => {
    console.log("STK PUSH CALLBACK");
    // Safaricom sends the callback data in the request body
    const callbackData = req.body.Body.stkCallback;

    if (!callbackData) {
        console.error("Callback received with empty or invalid body.");
        // Respond to Safaricom with an error if the body is invalid
        return res.status(400).json({ message: "Invalid callback data" });
    }

    const merchantRequestID = callbackData.MerchantRequestID;
    const checkoutRequestID = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;
    const callbackMetadata = callbackData.CallbackMetadata;

    let amount = null;
    let mpesaReceiptNumber = null;
    let transactionDate = null;
    let phoneNumber = null;

    // Extract data from CallbackMetadata if it exists and has items
    if (callbackMetadata && callbackMetadata.Item && Array.isArray(callbackMetadata.Item)) {
        callbackMetadata.Item.forEach(item => {
            switch (item.Name) {
                case 'Amount':
                    amount = item.Value;
                    break;
                case 'MpesaReceiptNumber':
                    mpesaReceiptNumber = item.Value;
                    break;
                case 'TransactionDate':
                    transactionDate = item.Value;
                    break;
                case 'PhoneNumber':
                    phoneNumber = item.Value;
                    break;
                // Add other cases if you expect more data in CallbackMetadata
            }
        });
    }

    console.log("MerchantRequestID:", merchantRequestID);
    console.log("CheckoutRequestID:", checkoutRequestID);
    console.log("ResultCode:", resultCode);
    console.log("ResultDesc:", resultDesc);

    console.log("Amount:", amount);
    console.log("MpesaReceiptNumber:", mpesaReceiptNumber);
    console.log("TransactionDate:", transactionDate);
    console.log("PhoneNumber:", phoneNumber);

    // You would typically process the callback data here:
    // - Check the ResultCode to determine if the transaction was successful.
    // - Find the corresponding transaction in your database using MerchantRequestID or CheckoutRequestID.
    // - Update the transaction status (e.g., 'completed', 'failed').
    // - Store the MpesaReceiptNumber, Amount, TransactionDate, etc.

    // Example: Log success or failure based on ResultCode
    if (resultCode === '0') {
        console.log("STK Push transaction successful!");
        // Perform actions for a successful transaction (e.g., update database)
    } else {
        console.log("STK Push transaction failed or was cancelled.");
        // Perform actions for a failed transaction (e.g., update database)
    }

    // Store the full callback JSON for debugging or record-keeping
    var json = JSON.stringify(req.body, null, 2); // Use null, 2 for pretty printing
    fs.writeFile(`stkcallback_${checkoutRequestID || 'unknown'}.json`, json, "utf8", function (err) {
      if (err) {
        console.error("Error writing STK PUSH CALLBACK to file:", err);
        // Even if writing to file fails, we should still respond to Safaricom
      } else {
        console.log(`STK PUSH CALLBACK for ${checkoutRequestID || 'unknown'} STORED SUCCESSFULLY`);
      }

      // **Crucially, send a 200 OK response back to Safaricom**
      // Safaricom expects a 200 OK response to confirm that you received the callback.
      // This should be done regardless of whether the transaction was successful or not,
      // and regardless of whether you successfully processed or stored the callback data.
      res.status(200).json({ message: "Callback received successfully" });
    });
  });

module.exports = router;*/

const express = require("express");
const router = express.Router();
const axios = require("axios");
const moment = require("moment"); // Using moment for timestamp generation
const fs = require('fs'); // For saving callback data

// Load environment variables (assuming you have a .env file and dotenv configured in your main app file)
// If this file is standalone, you might need require('dotenv').config(); at the top
const consumerKey = process.env.CONSUMER_KEY_SANDBOX;
const consumerSecret = process.env.CONSUMER_SECRET_SANDBOX;
const businessShortCode = process.env.SHORT_CODE_SANDBOX; // Use env variable for short code
const passkey = process.env.PASSKEY_SANDBOX; // Use env variable for passkey

// --- Helper function to get Access Token ---
// This function is now internal to this file
async function getAccessToken() {
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    try {
        console.log("Attempting to get access token...");
        const response = await axios.get(url, {
            headers: {
                Authorization: auth,
            },
        });
        console.log("Access token obtained successfully.");
        return response.data.access_token;
    } catch (error) {
        console.error("Error getting access token:", error.message);
        // Log the full error response if available
        if (error.response) {
            console.error("Safaricom OAuth Error Response Data:", error.response.data);
            console.error("Safaricom OAuth Error Response Status:", error.response.status);
        }
        throw new Error(`Failed to get Safaricom access token: ${error.message}`);
    }
}

// --- STK Push Initiation Route ---
router.post('/stkpush', async (req, res) => {
    console.log("--- /stkpush POST handler started ---");

    try {
        // 1. Input Validation (Basic - more robust validation might be needed)
        const { phone, amount } = req.body;
        console.log(`1. Received phone: ${phone}, amount: ${amount}`);

        if (!phone || !amount || amount <= 0) {
            console.log("2. Validation failed: Missing phone or invalid amount.");
            return res.status(400).json({
                msg: "Invalid input: Please provide a valid phone number and amount.",
                status: false,
            });
        }
        console.log("2. Input validation passed.");

        // 3. Get Access Token
        console.log("3. Calling getAccessToken function...");
        const accessToken = await getAccessToken();
        console.log("4. Access token successfully retrieved.");

        // 5. Prepare STK Push Parameters
        let phoneNumber = phone;
        if (phoneNumber.startsWith("0")) {
            phoneNumber = "254" + phoneNumber.slice(1);
            console.log(`5a. Formatted phone number: ${phoneNumber}`);
        } else if (!phoneNumber.startsWith("254")) {
             // Optional: Handle numbers that don't start with 0 or 254
             // For simplicity, we'll assume valid formats or add a warning
             console.warn(`5a. Phone number does not start with 0 or 254: ${phoneNumber}`);
             // You might choose to return an error here depending on requirements
        } else {
             console.log("5a. Phone number already in 254 format.");
        }


        const timestamp = moment().format("YYYYMMDDHHmmss");
        const password = Buffer.from(
            businessShortCode + passkey + timestamp
        ).toString("base64");
        console.log("5b. Timestamp and password generated.");

        const stkPushUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const callbackURL = `https://car-hire-system-backend.onrender.com/api/payment/callback`; // Ensure this is your deployed callback URL
        console.log(`5c. Using CallbackURL: ${callbackURL}`);

        const payload = {
            BusinessShortCode: businessShortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline", // Or CustomerBuyGoodsOnline if applicable
            Amount: amount,
            PartyA: phoneNumber, // Initiator phone number
            PartyB: businessShortCode, // Merchant short code
            PhoneNumber: phoneNumber, // Phone number to receive the prompt
            CallBackURL: callbackURL,
            AccountReference: 'Car Hire Payment', // Your internal reference
            TransactionDesc: 'Payment for car hire', // Description for the user
        };
        console.log("5d. STK Push payload created.");
        // console.log("Payload:", payload); // Log payload for debugging if needed

        // 6. Send STK Push Request to Safaricom
        console.log("6. Attempting to send STK Push request to Safaricom...");
        try {
            const response = await axios.post(
                stkPushUrl,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json' // Explicitly set content type
                    },
                }
            );
            console.log("7. Received immediate response from Safaricom.");
            console.log("8. Safaricom response data:", response.data);

            // 9. Send Success Response to Frontend
            console.log("9. Sending 200 response to frontend.");
            res.status(200).json({
                msg: "STK Push request received by Safaricom. Check your phone to complete.",
                success: true, // Use 'success' for clarity
                checkoutRequestId: response.data.CheckoutRequestID, // Return this for tracking
                merchantRequestId: response.data.MerchantRequestID, // Return this for tracking
                safaricomResponse: response.data // Include full response for debugging
            });
            console.log("10. 200 response sent.");

        } catch (axiosError) {
            // Handle errors specifically from the STK Push API call
            console.error("7. Error sending STK Push request to Safaricom:", axiosError.message);
            if (axiosError.response) {
                console.error("Safaricom STK Push Error Response Data:", axiosError.response.data);
                console.error("Safaricom STK Push Error Response Status:", axiosError.response.status);
            }

            // 8. Send Error Response to Frontend
            console.log("8. Sending 500 response to frontend due to Safaricom STK Push error.");
            res.status(500).json({
                msg: "Failed to initiate STK Push with Safaricom.",
                success: false,
                error: axiosError.response ? axiosError.response.data : axiosError.message
            });
            console.log("9. 500 response (axios error) sent.");
        }

    } catch (generalError) {
        // Handle errors from getting the access token or other unexpected issues
        console.error("3. An unexpected error occurred in /stkpush handler:", generalError.message);
        console.error("Full error:", generalError); // Log the full error object

        // 4. Send Error Response to Frontend
        console.log("4. Sending 500 response to frontend due to general error.");
        res.status(500).json({
            msg: "An internal server error occurred during payment initiation.",
            success: false,
            error: generalError.message
        });
        console.log("5. 500 response (general error) sent.");
    }
    console.log("--- /stkpush POST handler finished ---"); // This log might appear before the response is fully sent over the network
});

// --- Callback URL Route ---
router.post("/callback", (req, res) => {
  console.log("--- /callback POST handler started ---");
  console.log("Received STK PUSH CALLBACK:", JSON.stringify(req.body, null, 2)); // Log the full body

  // Safaricom sends the callback data in the request body, specifically under Body.stkCallback
  const callbackData = req.body.Body && req.body.Body.stkCallback ? req.body.Body.stkCallback : null;

  if (!callbackData) {
      console.error("Callback received with empty or invalid Body.stkCallback structure.");
      // Respond to Safaricom with an error if the body is invalid
      // Safaricom expects a 200 OK even for invalid data, but logging the issue is important
      return res.status(200).json({ message: "Invalid callback data received, but acknowledged." });
  }

  const merchantRequestID = callbackData.MerchantRequestID;
  const checkoutRequestID = callbackData.CheckoutRequestID;
  const resultCode = callbackData.ResultCode;
  const resultDesc = callbackData.ResultDesc;
  const callbackMetadata = callbackData.CallbackMetadata; // This contains the actual transaction details on success

  console.log("Callback Details:");
  console.log("  MerchantRequestID:", merchantRequestID);
  console.log("  CheckoutRequestID:", checkoutRequestID);
  console.log("  ResultCode:", resultCode);
  console.log("  ResultDesc:", resultDesc);

  let amount = null;
  let mpesaReceiptNumber = null;
  let transactionDate = null;
  let phoneNumber = null;

  // Extract data from CallbackMetadata if the transaction was successful (ResultCode === '0')
  if (resultCode === '0' && callbackMetadata && callbackMetadata.Item && Array.isArray(callbackMetadata.Item)) {
      console.log("Transaction was successful. Extracting metadata...");
      callbackMetadata.Item.forEach(item => {
          switch (item.Name) {
              case 'Amount':
                  amount = item.Value;
                  break;
              case 'MpesaReceiptNumber':
                  mpesaReceiptNumber = item.Value;
                  break;
              case 'TransactionDate':
                  transactionDate = item.Value; // Format: YYYYMMDDHHmmss
                  break;
              case 'PhoneNumber':
                  phoneNumber = item.Value;
                  break;
              // Add other cases if you expect more data in CallbackMetadata
          }
      });
      console.log("  Amount:", amount);
      console.log("  MpesaReceiptNumber:", mpesaReceiptNumber);
      console.log("  TransactionDate:", transactionDate);
      console.log("  PhoneNumber:", phoneNumber);

      // --- IMPORTANT: Process Successful Transaction ---
      // This is where you update your database:
      // 1. Find the pending transaction using `CheckoutRequestID` or `MerchantRequestID`.
      // 2. Verify the `Amount` matches the expected amount for that transaction.
      // 3. Update the transaction status to 'completed' or 'successful'.
      // 4. Store `MpesaReceiptNumber`, `TransactionDate`, `Amount`, `PhoneNumber`.
      // 5. You might trigger other actions here, like confirming a booking.
      console.log("Processing successful transaction...");
      // Example: Call a service function to update the database
      // updateTransactionStatus(checkoutRequestID, 'completed', {
      //     amount,
      //     mpesaReceiptNumber,
      //     transactionDate,
      //     phoneNumber
      // });

  } else {
      // --- IMPORTANT: Process Failed or Cancelled Transaction ---
      console.log("Transaction failed or was cancelled (ResultCode:", resultCode, ").");
      // This is where you update your database for failed transactions:
      // 1. Find the pending transaction using `CheckoutRequestID` or `MerchantRequestID`.
      // 2. Update the transaction status to 'failed' or 'cancelled'.
      // 3. Store the `ResultCode` and `ResultDesc` for debugging.
      console.log("Processing failed transaction...");
      // Example: Call a service function to update the database
      // updateTransactionStatus(checkoutRequestID, 'failed', {
      //     resultCode,
      //     resultDesc
      // });
  }

  // --- Optional: Save the full callback JSON to a file ---
  // This is useful for debugging and having a record of all callbacks received.
  const filename = `stkcallback_${checkoutRequestID || 'unknown'}_${resultCode || 'unknown'}.json`;
  fs.writeFile(filename, JSON.stringify(req.body, null, 2), "utf8", function (err) {
      if (err) {
          console.error(`Error writing STK PUSH CALLBACK to file ${filename}:`, err);
          // Even if writing to file fails, we MUST still respond to Safaricom
      } else {
          console.log(`STK PUSH CALLBACK for ${checkoutRequestID || 'unknown'} STORED SUCCESSFULLY in ${filename}`);
      }

      // **Crucially, send a 200 OK response back to Safaricom**
      // Safaricom expects a 200 OK response to confirm that you received the callback.
      // This should be done regardless of whether the transaction was successful or not,
      // and regardless of whether you successfully processed or stored the callback data.
      // The content of the response body doesn't matter much to Safaricom,
      // but sending JSON is standard.
      console.log("Sending 200 OK response to Safaricom.");
      res.status(200).json({ message: "Callback received successfully" });
      console.log("--- /callback POST handler finished ---");
  });
});

// Export the router
module.exports = router;