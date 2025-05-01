const express = require("express");
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

module.exports = router;