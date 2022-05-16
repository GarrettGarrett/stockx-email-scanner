const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs') // File handling package
import { sendWebhook } from '../../utils/Discord';


const RESPONSES_SHEET_ID = '1gxQKq2KzFFirj-5aFaMLKBqgLA3d_8hhoEvAoKe8DCU'; // spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID); // const RESPONSES_SHEET_ID = '19lo-6eEXYmu_gw5FgyeVZJ9DoJblPQTVbVorSL1Ppus';

const updateSheets = async (_fineParse) => {
    await doc.useServiceAccountAuth({
        client_email: process.env.CLIENT_EMAIL,
        private_key:  process.env.private_key,
    });

    await doc.loadInfo();
    let sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows()

    
    
        if (_fineParse.hasDeliveredEmail){ //dealing with delivered entry
            let deliveredEmailMatched = false
            // check to see if a confirmed entry exists - fine if it doesnt.
            rows.forEach((row, index) => {
                if (row['Order Number'] == _fineParse.orderNumber) {
                    rows[index]['hasDeliveredEmail'] = _fineParse.hasDeliveredEmail
                    rows[index]['Delivery Date'] = _fineParse.date
                    rows[index].save()
                    console.log("sheet updated")
                    deliveredEmailMatched = true
                }
            })

            if (!deliveredEmailMatched) {// if a confirmed entry does not exist, then insert one but label it for delivery too
                console.log("delivery email here, but no confirmation entry....creating confirm row and marking delivered")
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
                        "hasConfirmedEmail": _fineParse.hasConfirmedEmail, 
                        "hasDeliveredEmail": _fineParse.hasDeliveredEmail, 
                        "Purchase Date": _fineParse.date,
                        "Delivery Date": _fineParse.date
                    }])
                    
                    console.log("sheet updated")
            }

        } else { //dealing with confirmed entry
            let confirmedEmailMatched = false
            // check to see if a confirmed entry exists - fine if it doesnt.
            rows.forEach((row, index) => {
                if (row['Order Number'] == _fineParse.orderNumber) {
                    rows[index]['hasConfirmedEmail'] = _fineParse.hasConfirmedEmail
                    rows[index]['Purchase Date'] = _fineParse.date
                    rows[index].save()
                    console.log("sheet updated")
                    confirmedEmailMatched = true
                }
            })

            if (!confirmedEmailMatched) {
                console.log("confirmed email here, but no delivery entry....creating confirm row and marking confirmed")
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
                        "hasConfirmedEmail": _fineParse.hasConfirmedEmail, 
                        "Purchase Date": _fineParse.date
                    }])
                    console.log("sheet updated")
            }
            }

    rows.save
    return true
};
//


const imapConfig = {
  user: process.env.GMAIL_USER,
  password: process.env.APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
    authTimeout: 10000,
    connTimeout: 30000,
    keepalive: true,
    tlsOptions: {
    rejectUnauthorized: false
}
}


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
        if (line.includes("Date:")){
            rawDetails["date"] = line
        }
    })
    return rawDetails
}

function formatDate(fineParseString){
  let edit1 = fineParseString.split(" at ")
  console.log("🚀 ~ file: email.js ~ line 152 ~ formatDate ~ edit1", edit1)
  return edit1[0]
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
    fineDetails["date"] = formatDate(rawDetails['date'].substring(rawDetails.date.indexOf(": ") + 2, rawDetails.date.length )  )

    if (rawDetails.subject.includes("Confirmed")){
        fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Confirmed:") + 11, rawDetails.subject.length)  
        fineDetails['hasConfirmedEmail'] = true
    }
    if (rawDetails.subject.includes("Delivered")){
        fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Delivered:") + 11, rawDetails.subject.length)  
        fineDetails['hasDeliveredEmail'] = true
        fineDetails['hasConfirmedEmail'] = true
    }

    return fineDetails

}//

function oneMonthsAgo(){
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d
}

let finalStatus = 0

const getEmails = () => {
    try {
      const imap = new Imap(imapConfig);
      imap.once('ready', () => {
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

                    let sendDiscordMe = await sendWebhook(_fineParse, "975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C") //my own
                    let sendDiscordHermes = await sendWebhook(_fineParse, "975584745754878042/nHrt5qw_bY4qlD0KPm8r6g3-3TkDP74f3fNcP0PZTYcjRpuAzR2vJDseaUPTQDbSGcB2") //hermes
                    console.log("🚀 ~ file: email.js ~ line 195 ~ simpleParser ~ sendDiscordMe", sendDiscordMe)
                    console.log("🚀 ~ file: email.js ~ line 196 ~ simpleParser ~ sendDiscordHermes", sendDiscordHermes)

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
        const emails = await getEmails()
        
        // return res.status(200).json({ data: "ok" })
               
          
        } 
    }

    
   



