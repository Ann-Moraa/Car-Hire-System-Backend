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

  router.post('/stkpush', (req, res) => {
    let phoneNumber = req.body.phone;
    const amount = req.body.amount;
  
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.slice(1);
    }
  
    getAccessToken()
      .then((accessToken) => {
        const url =
          "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + accessToken;
        const timestamp = moment().format("YYYYMMDDHHmmss");
        const password = new Buffer.from(
          businessShortCode +
          passkey +
          timestamp
        ).toString("base64");
  
        axios
          .post(
            url,
            {
              BusinessShortCode: businessShortCode,
              Password: password,
              Timestamp: timestamp,
              TransactionType: "CustomerBuyGoodsOnline",
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
          )
          .then((response) => {
            //SEND BACK A JSON RESPONSE TO THE CLIENT
            console.log(response.data);
            res.status(200).json({
              msg: "Request is successful done ✔✔. Please enter mpesa pin to complete the transaction",
              status: true,
            });
  
          })
          .catch((error) => {
            console.log(error);
            //res.status(500).send("❌ Request failed");
            console.log(error);
            res.status(500).json({
              msg: "Request failed",
              status: false,
            });
          });
      })
      .catch(console.log);
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