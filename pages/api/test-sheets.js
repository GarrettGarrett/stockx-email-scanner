const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs') // File handling package


const RESPONSES_SHEET_ID = '1gxQKq2KzFFirj-5aFaMLKBqgLA3d_8hhoEvAoKe8DCU'; // spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID); // const RESPONSES_SHEET_ID = '19lo-6eEXYmu_gw5FgyeVZJ9DoJblPQTVbVorSL1Ppus';


export default async (req, res) => {
   
    if (req.method === 'GET') {
        await doc.useServiceAccountAuth({
            client_email: process.env.CLIENT_EMAIL,
            private_key:  process.env.private_key,
        });
        
        await doc.loadInfo();
        let sheet = doc.sheetsByTitle["Unsold GOAT"]
        console.log("🚀 ~ file: test-sheets.js ~ line 21 ~ sheet", sheet)
        const rows = await sheet.getRows()
        // let justOrderNumbers = []
        // rows.forEach(row => {
        //     justOrderNumbers.push(row['Order Number'])
        // })
        // console.log("🚀 ~ file: test-sheets.js ~ line 22 ~ rows", justOrderNumbers)
        const moreRows = await sheet.addRows([
            { 
                "Style ID": "test", 
                
            },
            { 
                "Style ID": "test2", 
                
            },
        
        ])       
        console.log("🚀 ~ file: test-sheets.js ~ line 38 ~ moreRows", moreRows)
        // let save = await sheet.saveCells();
            }
            console.log("sheet updated") 
            return res.status(200).json({ data: "ok" })

    }
