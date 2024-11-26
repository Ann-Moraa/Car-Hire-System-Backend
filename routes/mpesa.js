const express = require("express");
const router = express.Router();
const { stk_input_schema } = require("../utils/schemas/stk_input_schema")
const parsePhoneNumber = require('libphonenumber-js');
const axios = require("axios")

router.post('/', async (req, res) => {
    try {

        const { error, value } = stk_input_schema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const authorization = await mpesaAuthDarajaService()
        if (!authorization) {
            return res.status(401).json({ message: "Mpesa authentication failed" });
        }

        const { access_token } = authorization

        const reqBody = {
            BusinessShortCode: process.env.DARAJA_SHORT_CODE,
            Password: password(),
            Timestamp: new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3),
            TransactionType: "CustomerBuyGoodsOnline",
            Amount: 1,
            PartyA: validatePhoneNumber(value.phoneNumber),
            PartyB: process.env.DARAJA_PARTY_B,
            PhoneNumber: validatePhoneNumber(value.phoneNumber),
            CallBackURL: process.env.DARAJA_CALLBACK_URL,
            AccountReference: "Credo Pap",
            TransactionDesc: "Credo Pap"
        }

        const response = await axios({
            method: 'post',
            url: process.env.DARAJA_STK_PUSH_URL,
            data: reqBody,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        })

        if (!response) {
            throw new Error('STK failed')
        }

        // insert payment into db


        res.status(200).json({
            message: 'msg',
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            message: error.message
        });
    }
})

function password() {
    const Shortcode = process.env.DARAJA_SHORT_CODE
    const Passkey = process.env.DARAJA_PASSKEY
    const Timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);

    const originalString = Shortcode + Passkey + Timestamp;
    const encodedString = btoa(originalString);

    return encodedString
}

async function mpesaAuthDarajaService() {
    try {
        const authorization = auth()

        const response = await axios({
            method: 'get',
            url: process.env.DARAJA_OAUTH2TOKEN_URL,
            params: { grant_type: 'client_credentials' },
            headers: { Authorization: `Basic ${authorization}` }
        })

        return response.data

    } catch (error) {
        console.log(error)
    }
}

function auth() {
    const customerKey = process.env.DARAJA_CUSTOMER_KEY
    const customerSecret = process.env.DARAJA_CUSTOMER_SECRET

    const originalString = customerKey + ':' + customerSecret;
    const encodedString = btoa(originalString);

    return encodedString
}

function validatePhoneNumber(phone_number) {
    const phoneNumber = parsePhoneNumber(phone_number, 'KE')
    const pn = phoneNumber?.formatInternational()
    return pn?.replace(/[+\s]/g, '')
};

module.exports = router;