const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs') // File handling package


const RESPONSES_SHEET_ID = '1lp0xjsFK8mjBmWaT_ewUc8gySqrZ41ecpV8W9GeCpMU'; // spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID); // const RESPONSES_SHEET_ID = '19lo-6eEXYmu_gw5FgyeVZJ9DoJblPQTVbVorSL1Ppus';

const updateSheets = async (_fineParse) => {
    await doc.useServiceAccountAuth({
        client_email: process.env.CLIENT_EMAIL,
        private_key:  process.env.private_key,
    });

    await doc.loadInfo();
    let sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows()
    
        if (_fineParse.isDeliveredEmail){
            rows.forEach((row, index) => {
                if (row['Order Number'] == _fineParse.orderNumber) {
                    rows[index]['isDeliveredEmail'] = _fineParse.isDeliveredEmail
                    rows[index].save()
                    console.log("sheet updated")
                }
            })//
        } else {
            const moreRows = await sheet.addRows([
                { 
                    "Style ID": _fineParse.styleID, 
                    "Size": _fineParse.size, 
                    "Title": _fineParse.title, 
                    "Condition": _fineParse.condition, 
                    "Order Number": _fineParse.orderNumber, 
                    "Purchase Price": _fineParse.purchasePrice, 
                    "Processing Fee": _fineParse.processingFee, 
                    "Shipping": _fineParse.shipping, 
                    "Total Payment": _fineParse.totalPayment, 
                    "isConfirmedEmail": _fineParse.isConfirmedEmail, 
                    "isDeliveredEmail": _fineParse.isDeliveredEmail, 
                }])
                console.log("sheet updated")
        }
    
    rows.save
    return true
};





const imapConfig = {
  user: process.env.GMAIL_USER,
  password: process.env.APP_PASSWORD,
  host: 'imap.googlemail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

function largeScaleParse(_string){
    const splitByLine = _string.split(/\r?\n/)
    let rawDetails = {}
    splitByLine.forEach(line => {
        if (line.includes("Style ID: ")){
            rawDetails["styleID"] = line
        }
        if (line.includes("Size:")){
            rawDetails["size"] = line
        }
        if (line.includes("Condition:")){
            rawDetails["condition"] = line
        }
        if (line.includes("Order number")){
            rawDetails["orderNumber"] = line
        }
        if (line.includes("Purchase Price:")){
            rawDetails["purchasePrice"] = line
        }
        if (line.includes("Processing Fee:")){
            rawDetails["processingFee"] = line
        }
        if (line.includes("Shipping:")){
            rawDetails["shipping"] = line
        }
        if (line.includes("Total Payment ")){
            rawDetails["totalPayment"] = line
        }
        if (line.includes("Subject:")){
            rawDetails["subject"] = line
        }
    })
    return rawDetails
}

function fineParse(rawDetails, subject) {
    let fineDetails = {}
    fineDetails["styleID"] = rawDetails['styleID'].substring(rawDetails.styleID.indexOf(": ") + 2, rawDetails.styleID.length)  
    fineDetails["size"] = rawDetails['size'].substring(rawDetails.size.indexOf(": ") + 2, rawDetails.size.length)  
    fineDetails["condition"] = rawDetails['condition'].substring(rawDetails.condition.indexOf(": ") + 2, rawDetails.condition.length)  
    fineDetails["orderNumber"] = rawDetails['orderNumber'].substring(rawDetails.orderNumber.indexOf(": ") + 2, rawDetails.orderNumber.length)  
    fineDetails["purchasePrice"] = rawDetails['purchasePrice'].substring(rawDetails.purchasePrice.indexOf(": ") + 2, rawDetails.purchasePrice.length)  
    fineDetails["processingFee"] = rawDetails['processingFee'].substring(rawDetails.processingFee.indexOf(": ") + 2, rawDetails.processingFee.length)  
    fineDetails["shipping"] = rawDetails['shipping'].substring(rawDetails.shipping.indexOf(": ") + 2, rawDetails.shipping.length)  
    fineDetails["totalPayment"] = rawDetails['totalPayment'].substring(rawDetails.totalPayment.indexOf("$") + 0, rawDetails.totalPayment.length - 1)  

    if (rawDetails.subject.includes("Confirmed")){
        fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Confirmed:") + 11, rawDetails.subject.length)  
        fineDetails['isConfirmedEmail'] = true
    }
    if (rawDetails.subject.includes("Delivered")){
        fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Delivered:") + 11, rawDetails.subject.length)  
        fineDetails['isDeliveredEmail'] = true
    }

    return fineDetails

}

function oneMonthsAgo(){
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d
}

let finalStatus = 0

const getEmails = () => {
    try {
      const imap = new Imap(imapConfig, );
      console.log("logged in")
      imap.once('ready', () => {
        console.log("ready")
        imap.openBox('INBOX', false, () => {
          imap.search(['UNSEEN', ['SINCE', oneMonthsAgo()]], (err, results) => {
            const f = imap.fetch(results, {bodies: ''});
            f.on('message', msg => {
              msg.on('body', stream => {
                simpleParser(stream, async (err, parsed) => {
                  // const {from, subject, textAsHtml, text} = parsed;
                  if (parsed?.text?.includes("StockX")) {
                      console.log("found a stockX email...")
                    let _largeScaleParse = largeScaleParse(parsed.text)
                    let _fineParse = fineParse(_largeScaleParse)
                    console.log("🚀 ~ file: email.js ~ line 68 ~ simpleParser ~ _finePArse", _fineParse)
                    const _updateSheets = await updateSheets(_fineParse)
                  } 
                  finalStatus = 1
                  /* Make API call to save the data
                     Save the retrieved data into a database.
                     E.t.c
                  */
                });
              });
              msg.once('attributes', attrs => {
                const {uid} = attrs;
                imap.addFlags(uid, ['\\Seen'], () => {
                  // Mark the email as read after reading it
                  console.log('Marked as read!');
                });
              });
            });
            f.once('error', ex => {
              return Promise.reject(ex);
            });
            f.once('end', () => {
              console.log('Done fetching all messages!');
              imap.end();
            });
          });
        });
      });
  
      imap.once('error', err => {
        console.log(err);
        
      });
  
      imap.once('end', () => {
        console.log('Connection ended');
        
      });
  
      imap.connect();
    } catch (ex) {
      console.log('an error occurred');
    }
  };

export default async (req, res) => {
   
    if (req.method === 'GET') {
        const emails = getEmails()
        
        return res.status(200).json({ data: "ok" })
               
          
        } 
    }

    
   



