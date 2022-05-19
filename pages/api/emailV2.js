const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs') // File handling package
import { sendWebhookArray } from '../../utils/DiscordArray';
import { sendWebhook } from '../../utils/Discord';


const RESPONSES_SHEET_ID = '1gxQKq2KzFFirj-5aFaMLKBqgLA3d_8hhoEvAoKe8DCU'; // spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID); // const RESPONSES_SHEET_ID = '19lo-6eEXYmu_gw5FgyeVZJ9DoJblPQTVbVorSL1Ppus';

async function getDoc() {
  let document = await doc.useServiceAccountAuth({
    client_email: process.env.CLIENT_EMAIL,
    private_key:  process.env.private_key,
  });
  return document
}

const connectDoc = getDoc()

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


function formatDate(fineParseString){
  let edit1 = fineParseString.split(" at ")
  return edit1[0]
}

function oneMonthsAgo(){
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d
}

function largeScaleParse(_string, subject, date){
  const splitByLine = _string.split(/\r?\n/)
  let rawDetails = {}
  splitByLine.forEach(line => {
      if (line.includes("Style ID:")){
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
      
      rawDetails["subject"] = subject

      if (line.includes("Date:")){
        rawDetails["date"] = line
      } else { //cannot parse date, meaning it was an auto forward, and date is from parsed.date
        rawDetails["date"] = date.toString()
        rawDetails["dateRetrievedFromStamp"] = true

      }
     
  })
  return rawDetails
}

function fineParse(rawDetails, subject) {
  // only continue if confirmation or delivery email:
  if (rawDetails?.subject?.includes("Confirmed") || rawDetails?.subject?.includes("Delivered")) {
    let fineDetails = {}
    fineDetails["styleID"] = rawDetails['styleID'].substring(rawDetails.styleID.indexOf(":") + 2, rawDetails.styleID.length)  
    fineDetails["size"] = rawDetails['size'].substring(rawDetails.size.indexOf(":") + 2, rawDetails.size.length)  
    fineDetails["condition"] = rawDetails['condition'].substring(rawDetails.condition.indexOf(":") + 2, rawDetails.condition.length)  
    fineDetails["orderNumber"] = rawDetails['orderNumber'].substring(rawDetails.orderNumber.indexOf(":") + 2, rawDetails.orderNumber.length)  
    fineDetails["purchasePrice"] = rawDetails['purchasePrice'].substring(rawDetails.purchasePrice.indexOf(": ") + 2, rawDetails.purchasePrice.length)  
    fineDetails["processingFee"] = rawDetails['processingFee'].substring(rawDetails.processingFee.indexOf(": ") + 2, rawDetails.processingFee.length)  
    fineDetails["shipping"] = rawDetails['shipping'].substring(rawDetails.shipping.indexOf(": ") + 2, rawDetails.shipping.length)  
    fineDetails["totalPayment"] = rawDetails['totalPayment'].substring(rawDetails.totalPayment.indexOf("$") + 0, rawDetails.totalPayment.length - 1)
    
    if (rawDetails.dateRetrievedFromStamp){
      fineDetails["date"] = rawDetails.date.substring(0,10)
    } else { //retrieved date from body 
      fineDetails["date"] = formatDate(rawDetails['date'].substring(rawDetails.date.indexOf(": ") + 2, rawDetails.date.length )  )
    }
    

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
  }
}


async function updateSheets(_fineParseArray) {
  await doc.loadInfo();
  let sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows()

  let bulkArray = []
  let singleArray = []

  let justOrderNumbers = []
        rows.forEach(row => {
            justOrderNumbers.push(row['Order Number'])
  })

  console.log("🚀 ~ file: emailV2.js ~ line 134 ~ updateSheets ~ justOrderNumbers", justOrderNumbers)


  async function iterateAndAddSingles () { 
    for (const _fineParse of _fineParseArray) {
      if (!justOrderNumbers.includes(_fineParse?.orderNumber)){ //if does not require matching, add to bulk
        bulkArray.push(_fineParse)
      }

      else { //matching to do...
        if (_fineParse?.hasDeliveredEmail){ //dealing with delivered entry
          let deliveredEmailMatched = false
          // check to see if a confirmed entry exists - fine if it doesnt.
          rows.forEach((row, index) => {
              if (row['Order Number'] == _fineParse?.orderNumber) {
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
  
      } else if (_fineParse?.hasConfirmedEmail) { //dealing with confirmed entry
          let confirmedEmailMatched = false
          // check to see if a confirmed entry exists - fine if it doesnt.
          rows.forEach((row, index) => {
              if (row['Order Number'] == _fineParse?.orderNumber) {
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
          } else { //not a confirmed or delivery email
              console.log("email received but not a confirmation or delivery")
          }}
    }
  }

    function formatFineParseForSheetsAdd(_fineParse){
      if (_fineParse?.hasDeliveredEmail){
        return { 
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
          "Delivery Date": _fineParse.date
        }
      } else { //confirmation email...
        return { 
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
          "Purchase Date": _fineParse.date
        }
      }
      

    }



    iterateAndAddSingles()
    console.log("Bulk: ", bulkArray)

    let formattedBulkArray = []
    bulkArray.forEach(_fineParse => {
      if (_fineParse?.styleID){
        formattedBulkArray.push(formatFineParseForSheetsAdd(_fineParse))
      }
    })
    const moreRows = await sheet.addRows(formattedBulkArray)

    console.log("Done adding rows")
    rows.save
    return true
}



export default async (req, res) => {
  
    if (req.method === 'GET') {
      let count = 0
      var startTime = performance.now()
        async function getEmails() {

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

                              console.log("found a stockX email...", parsed.subject, parsed.date)
                              let _largeScaleParse = largeScaleParse(parsed.text, parsed.subject, parsed.date)
                              
                              
                              let _fineParse = fineParse(_largeScaleParse)
                              if (_fineParse?.styleID){ //ignore 'unknowns'
                                _fineParseList.push(_fineParse)
                              }
                             
                              console.log("🚀 ~ file: emailV2.js ~ line 196 ~ simpleParser ~ _fineParseList", _fineParseList)
                              // const _updateSheets = await updateSheets(_fineParse)
                          } 

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
                          count ++
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
                connectionEnded = true
              });
          
              imap.connect();
            } catch (ex) {
              console.log(ex);
            }
          };

          let _fineParseList = [] //all shoe objects that will need to be added to Sheets
          let connectionEnded = false
          const emails = await getEmails()
          while (!connectionEnded) {
            await new Promise(r => setTimeout(r, 1000));
          }
          if (connectionEnded) {
            let sheetUpdate = await updateSheets(_fineParseList)
            console.log("🚀 ~ file: emailV2.js ~ line 352 ~ _fineParseList", _fineParseList)

            var endTime = performance.now()
            console.log("🚀 ~ file: emailV2.js ~ line 329 ~ sheetUpdate", sheetUpdate)

            if (_fineParseList.length > 1) {
              let sendDiscordMe = await sendWebhookArray(_fineParseList, "975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C")
            }
            if (_fineParseList.length == 1){
              let sendDiscordMe = await sendWebhook(_fineParseList[0], "975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C") //my own
            }

            return res.status(200).json({ data: `\nSeconds: ${((endTime - startTime) / 1000).toFixed(2)} \nMarked Read: ${count}` })
          }
    }
  }

  
 
