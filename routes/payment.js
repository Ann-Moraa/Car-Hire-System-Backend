const express = require("express");
const router = express.Router();
const fs = require('fs');
const axios = require("axios");
const moment = require("moment");

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

  router.post('/stkpush', async (req, res) => {
    console.log("--- STK Push POST handler started ---"); // <-- Clear start marker
    try {
        console.log("1. Parsing request body...");
        let phoneNumber = req.body.phone;
        const amount = req.body.amount;
        console.log(`2. Received phone: ${phoneNumber}, amount: ${amount}`);

        if (!phoneNumber || !amount) {
            console.log("3. Missing phone number or amount. Sending 400 response.");
            return res.status(400).json({
                msg: "Missing phone number or amount in request body.",
                status: false
            });
            console.log("4. 400 response sent (should not see this)."); // <-- This log should not appear after return
        }
        console.log("5. Input validation passed.");

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
              msg: "Failed to initiate STK Push with Safaricom.",
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
    const merchantRequestID = req.body.Body.stkCallback.MerchantRequestID;
    const checkoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
    const resultCode = req.body.Body.stkCallback.ResultCode;
    const resultDesc = req.body.Body.stkCallback.ResultDesc;
    const callbackMetadata = req.body.Body.stkCallback.CallbackMetadata;
    const amount = callbackMetadata.Item[0].Value;
    const mpesaReceiptNumber = callbackMetadata.Item[1].Value;
    const transactionDate = callbackMetadata.Item[3].Value;
    const phoneNumber = callbackMetadata.Item[4].Value;
  
    console.log("MerchantRequestID:", merchantRequestID);
    console.log("CheckoutRequestID:", checkoutRequestID);
    console.log("ResultCode:", resultCode);
    console.log("ResultDesc:", resultDesc);
    
    console.log("Amount:", amount);
    console.log("MpesaReceiptNumber:", mpesaReceiptNumber);
    console.log("TransactionDate:", transactionDate);
    console.log("PhoneNumber:", phoneNumber);
  
    var json = JSON.stringify(req.body);
    fs.writeFile("stkcallback.json", json, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("STK PUSH CALLBACK STORED SUCCESSFULLY");
      
      // Send a 200 OK response back to Safaricom
      res.status(200).json({ message: "Callback received successfully" });
    });
  });

module.exports = router;