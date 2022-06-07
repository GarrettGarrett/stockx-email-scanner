const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs') // File handling package
import { sendWebhookArray } from '../../utils/DiscordArray';
import { sendWebhook } from '../../utils/Discord';
import {sendWebhookArrayGoat} from '../../utils/DiscordArrayGoat'
import { sendWebhookGoat} from '../../utils/DiscordGoat'
import { sendWebhookManyStockX } from '../../utils/DiscordArrayStockX'

// #######################################################
let testmode = false //when true= only i get discord hooks.  when false, hermes gets too
let maxEmailsAtOnce = 7 //set the max number of emails to read on each api request. Helpful when limited timeout.
// #######################################################


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

function subtractHours(numOfHours, date) {
  date.setHours(date.getHours() - numOfHours);
  return date;
}


function formatDate(fineParseStockXString){
  let edit1 = fineParseStockXString.split(" at ")
  return edit1[0]
}

function oneMonthsAgo(){
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d
}

function largeScaleParseGoat(_string, subject, date){
  let rawDetails = {}
  
  const splitByLine = _string.split(/\r?\n/)

  if (splitByLine.includes("Thank you for your order")) {
    rawDetails.type = "Confirmed"
  } if (splitByLine.includes("Your sneakers are being stored")) {
    rawDetails.type = "Storage"
  }
  rawDetails["date"] = date.toString()
  rawDetails["dateRetrievedFromStamp"] = true

  if (rawDetails.type == "Confirmed") {
    let indexOfItemSummary = splitByLine.indexOf("item summary")
    rawDetails.styleID = splitByLine[indexOfItemSummary - 2] //this could change
    rawDetails.title = splitByLine[indexOfItemSummary - 1] //this could change
    rawDetails.brand = splitByLine[indexOfItemSummary + 1] 
    rawDetails.size = splitByLine[indexOfItemSummary + 3] 
    rawDetails.condition = splitByLine[indexOfItemSummary + 6] 
  
    splitByLine.forEach(line => {
      if (line.includes("Order #")){
          rawDetails["orderNumber"] = line
      }
    })
  
    let indexOfOrderSummary = splitByLine.indexOf("order summary")
    rawDetails.subTotal = splitByLine[indexOfOrderSummary + 1]
    rawDetails.shipping = splitByLine[indexOfOrderSummary + 2]
    rawDetails.goatCredit = splitByLine[indexOfOrderSummary + 4]
    rawDetails.totalPaid = splitByLine[indexOfOrderSummary + 5]
  
    return rawDetails
  }

  if (rawDetails.type == "Storage") { //in the stored email, some details are not mentioned such as brand, shipping, etc
    let anchorText = splitByLine.indexOf("what are my options?") //will probably change
    rawDetails.styleID = splitByLine[anchorText - 2] 
    rawDetails.title = splitByLine[anchorText - 1] 
    splitByLine.forEach(line => {
      if (line.includes("Order #")){
          rawDetails["orderNumber"] = line
      }
    })
    return rawDetails
  }

  
}

function largeScaleParseStockX(_string, subject, date){
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

function fineParseGoat(rawDetails, subject) { //only continue if confirmation or storage email
  console.log("🚀 ~ file: emailV2.js ~ line 151 ~ fineParseGoat ~ rawDetails", rawDetails)
  if (
      rawDetails?.type?.includes("Confirmed") //this info is set during largescaleparseGoat
  ) {
    let fineDetails = {}
    fineDetails["styleID"] = "None"//shoes have style id, but basketball for example wont.
    fineDetails["styleID"] = rawDetails?.styleID 
    fineDetails.website = "Goat"
    fineDetails["title"] = rawDetails['title']
    fineDetails["size"] = rawDetails?.size 
    fineDetails["condition"] = rawDetails?.condition 
    fineDetails["orderNumber"] = rawDetails['orderNumber'].substring(rawDetails.orderNumber.indexOf("#") + 1, rawDetails.orderNumber.length)  //Order #476756560 == 476756560
    fineDetails["subTotal"] = rawDetails['subTotal'].substring(rawDetails.subTotal.indexOf("$") + 0, rawDetails.subTotal.length)  
    fineDetails["shipping"] = rawDetails['shipping'].substring(rawDetails.shipping.indexOf("$") + 1, rawDetails.shipping.length)  
    fineDetails["goatCredit"] = rawDetails['goatCredit'].substring(rawDetails.goatCredit.indexOf("goat credit") + 11, rawDetails.goatCredit.length)  
    fineDetails["totalPaid"] = rawDetails['totalPaid'].substring(rawDetails.totalPaid.indexOf("$") + 1, rawDetails.totalPaid.length)  
    
    if (rawDetails.dateRetrievedFromStamp){
      fineDetails["date"] = rawDetails.date.substring(0,10)
    } else { //retrieved date from body 
      fineDetails["date"] = formatDate(rawDetails['date'].substring(rawDetails.date.indexOf(": ") + 2, rawDetails.date.length )  )
    }

    if (rawDetails.type.includes("Confirmed")){
      fineDetails['hasConfirmedEmail'] = true
    }
    if (rawDetails.type.includes("Storage")){
      fineDetails['hasStorageEmail'] = true
      fineDetails['hasConfirmedEmail'] = true
    }

    console.log("fineDetails", fineDetails)
    return fineDetails
  } if (rawDetails?.type?.includes("Storage")) {
    let fineDetails = {}
    fineDetails["styleID"] = "None"//shoes have style id, but basketball for example wont.
    fineDetails["styleID"] = rawDetails?.styleID 
    fineDetails.website = "Goat"
    fineDetails["title"] = rawDetails['title']
    fineDetails["orderNumber"] = rawDetails['orderNumber'].substring(rawDetails.orderNumber.indexOf("#") + 1, rawDetails.orderNumber.length)  //Order #476756560 == 476756560
    
    if (rawDetails.dateRetrievedFromStamp){
      fineDetails["date"] = rawDetails.date.substring(0,10)
    }

    if (rawDetails.type.includes("Confirmed")){
      fineDetails['hasConfirmedEmail'] = true
    }
    if (rawDetails.type.includes("Storage")){
      fineDetails['hasStorageEmail'] = true
      fineDetails['hasConfirmedEmail'] = true
    }

    console.log("GOAT fineDetails", fineDetails)
    return fineDetails
  }
  
}

function fineParseStockX(rawDetails, subject) { // only continue if confirmation or delivery or refund email:
  if (
      rawDetails?.subject?.includes("Confirmed") 
    || rawDetails?.subject?.includes("Delivered")
    || rawDetails?.subject?.includes("Refund")
  ) {
    let fineDetails = {}
    fineDetails["styleID"] = "None"//shoes have style id, but basketball for example wont.
    fineDetails["styleID"] = rawDetails['styleID']?.substring(rawDetails.styleID.indexOf(":") + 2, rawDetails.styleID.length)  
    fineDetails.website = "StockX"
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
    if (rawDetails.subject.includes("Refund")){
      fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Refund Issued:") + 15, rawDetails.subject.length)  
      fineDetails['isRefund'] = true
  }
    return fineDetails
  }
}






async function updateSheets(_fineParseArray, website) { //_fineParseStockXArray or _fineParseGoatArray
  await doc.loadInfo();
  let importerStockX = doc.sheetsByTitle["Importer - SX"]; //stockx importer tab
  let importerGoat = doc.sheetsByTitle["Importer - GOAT"] //goat importer tab
  let unsoldGoat = doc.sheetsByTitle["Unsold GOAT"] //goat unsold tab - used only for GOAT, when shoe is stored - can be written into unsold tab.
  
  let sheet
  if (website == "StockX") {
    sheet = importerStockX
  }
  if (website == "Goat") {
    sheet = importerGoat
  }
  const rows = await sheet.getRows()

  let bulkArray = []
  let singleArray = []

  let justOrderNumbers = []
        rows.forEach(row => {
            justOrderNumbers.push(row['Order Number'])
  })

  console.log("🚀 ~ file: emailV2.js ~ line 134 ~  ~ justOrderNumbers", justOrderNumbers)

  async function updateUnsoldGoatRow(entireRow, _unsoldGoat, index){
    let unsoldGoat = doc.sheetsByTitle["Unsold GOAT"] //goat unsold tab - used only for GOAT, when shoe is stored - can be written into unsold tab.

    const moreRows = await unsoldGoat.addRows([
      { 
          "Style ID": entireRow["Style ID"], 
          "Size": entireRow["Size"], 
          "Title": entireRow["Title"], 
          "Condition": entireRow["Condition"], 
          "Order Number": entireRow["Order Number"], 
          "Sub Total": entireRow["Sub Total"], 
          "Goat Credit": entireRow["Goat Credit"], 
          "Shipping": entireRow["Shipping"], 
          "Total Paid": entireRow["Total Paid"], 
          "hasConfirmedEmail": entireRow["hasConfirmedEmail"], 
          "hasStorageEmail": entireRow["hasStorageEmail"], 
          "Is Cancelled": entireRow["Is Cancelled"], 
          "Purchase Date": entireRow["Purchase Date"], 
          "Delivery Date": entireRow["Delivery Date"], 
          "Delivery Confirmed": entireRow["Delivery Confirmed"],    
          
      },
  
  ])  
  }


  async function iterateAndAddSinglesGoat() {
    for (const _fineParseGoat of _fineParseArray) {
      if (!justOrderNumbers.includes(_fineParseGoat?.orderNumber)){ //if does not require matching, add to bulk.  (Because order # does not yet exist in sheet.)
        bulkArray.push(_fineParseGoat)
      }

      else { //Order # exists in sheet, matching to do...
        if (_fineParseGoat?.hasStorageEmail){ //dealing with hasStorageEmail entry.  
          let deliveredEmailMatched = false // check to see if a confirmed entry exists - fine if it doesn't.
          rows.forEach((row, index) => {
              if (row['Order Number'] == _fineParseGoat?.orderNumber) {
                  rows[index]['hasStorageEmail'] = _fineParseGoat.hasStorageEmail
                  rows[index]['Delivery Date'] = _fineParseGoat.date
                  rows[index]['Delivery Confirmed'] = _fineParseGoat.hasStorageEmail
                  let entireRow = rows[index]//._rawData fpr just values
                  rows[index].save()
                  console.log("Goat Sheet Updated")
                  deliveredEmailMatched = true

                  // Because it's a storage email, and this order exists in importer sheet, it needs to be added to unsold Goat tab.
                  updateUnsoldGoatRow(entireRow, unsoldGoat, index)
                  // testUpdateSheet()
                  console.log("Goat Unsold Sheet Updated")
              }
          })
  
          if (!deliveredEmailMatched) {//  if a confirmed entry does not exist, then insert one but label it for delivery too
              console.log("Goat storage email here, but no confirmation entry....creating confirm row and marking delivered")
              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseGoat.styleID, 
                      "Size": _fineParseGoat.size, 
                      "Title": _fineParseGoat.title, 
                      "Condition": _fineParseGoat.condition, 
                      "Order Number": _fineParseGoat.orderNumber, 
                      "Sub Total": _fineParseGoat.subTotal, 
                      "Shipping": _fineParseGoat.shipping, 
                      "Goat Credit": _fineParseGoat.goatCredit, 
                      "Total Paid": _fineParseGoat.totalPaid, 
                      "hasConfirmedEmail": _fineParseGoat.hasConfirmedEmail, 
                      "hasStorageEmail": _fineParseGoat.hasStorageEmail, 
                      "Purchase Date": _fineParseGoat.date,
                      "Delivery Date": _fineParseGoat.date
                  }])
                  console.log("Goat Sheet Updated")
          }
  
      } else if (_fineParseGoat?.hasConfirmedEmail) { //dealing with confirmed entry
          let confirmedEmailMatched = false
          rows.forEach((row, index) => {  // check to see if a confirmed entry exists - fine if it doesnt.
              if (row['Order Number'] == _fineParseGoat?.orderNumber) {
                  rows[index]['hasConfirmedEmail'] = _fineParseGoat.hasConfirmedEmail
                  rows[index]['Purchase Date'] = _fineParseGoat.date
                  rows[index].save()
                  console.log("Goat Sheet Updated")
                  confirmedEmailMatched = true
              }
          })
  
          if (!confirmedEmailMatched) {
              console.log("Goat confirmed email here, but no storage entry....creating confirm row and marking confirmed")
              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseGoat.styleID, 
                      "Size": _fineParseGoat.size, 
                      "Title": _fineParseGoat.title, 
                      "Condition": _fineParseGoat.condition, 
                      "Order Number": _fineParseGoat.orderNumber, 
                      "Sub Total": _fineParseGoat.subTotal, 
                      "Shipping": _fineParseGoat.shipping, 
                      "Goat Credit": _fineParseGoat.goatCredit, 
                      "Total Paid": _fineParseGoat.totalPaid, 
                      "hasConfirmedEmail": _fineParseGoat.hasConfirmedEmail, 
                      "Purchase Date": _fineParseGoat.date
                  }])
                  console.log("Goat Sheet Updated")
          }

          // Un comment this section to deal with GOAT refunds.  needs to be adjusted.
        //  } else if (_fineParseGoat?.isRefund) {
        //     console.log("found refund email")
        //     let refundEmailMatched = false
        //     rows.forEach((row, index) => {  // check to see if a refund entry exists - fine if it doesn't.
        //       if (row['Order Number'] == _fineParseGoat?.orderNumber) {
        //           rows[index]['Is Cancelled'] = _fineParseGoat.isRefund
        //           rows[index]['Purchase Date'] = _fineParseGoat.date
        //           rows[index].save()
        //           console.log("sheet updated")
        //           refundEmailMatched = true
        //       }
        //     })
        //     if (!refundEmailMatched) {
        //       console.log("refund email here, but no delivery/confirmation entry....creating refund row and marking confirmed")
        //       const moreRows = await importerStockX.addRows([
        //           { 
        //               "Style ID": _fineParseGoat.styleID, 
        //               "Size": _fineParseGoat.size, 
        //               "Title": _fineParseGoat.title, 
        //               "Condition": _fineParseGoat.condition, 
        //               "Order Number": _fineParseGoat.orderNumber, 
        //               "Purchase Price": _fineParseGoat.purchasePrice, 
        //               "Processing Fee": _fineParseGoat.processingFee, 
        //               "Shipping": _fineParseGoat.shipping, 
        //               "Total Payment": _fineParseGoat.totalPayment, 
        //               "Is Cancelled": _fineParseGoat.isRefund, 
        //               "Purchase Date": _fineParseGoat.date
        //           }])
        //           console.log("sheet updated")
        //   }
            
          

          } else { //not a confirmed or delivery email
              console.log("Goat email received but not a confirmation or storage")
          }}
    }
  }
// ---------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------
  async function iterateAndAddSinglesStockX () { 
    for (const _fineParseStockX of _fineParseArray) {
      if (!justOrderNumbers.includes(_fineParseStockX?.orderNumber)){ //if does not require matching, add to bulk.  (Because order # does not yet exist in sheet.)
        bulkArray.push(_fineParseStockX)
      }

      else { //Order # exists in sheet, matching to do...
        if (_fineParseStockX?.hasDeliveredEmail){ //dealing with delivered entry
          let deliveredEmailMatched = false // check to see if a confirmed entry exists - fine if it doesn't.
          rows.forEach((row, index) => {
              if (row['Order Number'] == _fineParseStockX?.orderNumber) {
                  rows[index]['hasDeliveredEmail'] = _fineParseStockX.hasDeliveredEmail
                  rows[index]['Delivery Date'] = _fineParseStockX.date
                  rows[index].save()
                  console.log("sheet updated")
                  deliveredEmailMatched = true
              }
          })
  
          if (!deliveredEmailMatched) {// if a confirmed entry does not exist, then insert one but label it for delivery too
              console.log("delivery email here, but no confirmation entry....creating confirm row and marking delivered")
              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseStockX.styleID, 
                      "Size": _fineParseStockX.size, 
                      "Title": _fineParseStockX.title, 
                      "Condition": _fineParseStockX.condition, 
                      "Order Number": _fineParseStockX.orderNumber, 
                      "Purchase Price": _fineParseStockX.purchasePrice, 
                      "Processing Fee": _fineParseStockX.processingFee, 
                      "Shipping": _fineParseStockX.shipping, 
                      "Total Payment": _fineParseStockX.totalPayment, 
                      "hasConfirmedEmail": _fineParseStockX.hasConfirmedEmail, 
                      "hasDeliveredEmail": _fineParseStockX.hasDeliveredEmail, 
                      "Purchase Date": _fineParseStockX.date,
                      "Delivery Date": _fineParseStockX.date
                  }])
                  console.log("sheet updated")
          }
  
      } else if (_fineParseStockX?.hasConfirmedEmail) { //dealing with confirmed entry
          let confirmedEmailMatched = false
          rows.forEach((row, index) => {  // check to see if a confirmed entry exists - fine if it doesnt.
              if (row['Order Number'] == _fineParseStockX?.orderNumber) {
                  rows[index]['hasConfirmedEmail'] = _fineParseStockX.hasConfirmedEmail
                  rows[index]['Purchase Date'] = _fineParseStockX.date
                  rows[index].save()
                  console.log("sheet updated")
                  confirmedEmailMatched = true
              }
          })
  
          if (!confirmedEmailMatched) {
              console.log("confirmed email here, but no delivery entry....creating confirm row and marking confirmed")
              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseStockX.styleID, 
                      "Size": _fineParseStockX.size, 
                      "Title": _fineParseStockX.title, 
                      "Condition": _fineParseStockX.condition, 
                      "Order Number": _fineParseStockX.orderNumber, 
                      "Purchase Price": _fineParseStockX.purchasePrice, 
                      "Processing Fee": _fineParseStockX.processingFee, 
                      "Shipping": _fineParseStockX.shipping, 
                      "Total Payment": _fineParseStockX.totalPayment, 
                      "hasConfirmedEmail": _fineParseStockX.hasConfirmedEmail, 
                      "Purchase Date": _fineParseStockX.date
                  }])
                  console.log("sheet updated")
          }

         } else if (_fineParseStockX?.isRefund) {
            console.log("found refund email")
            let refundEmailMatched = false
            rows.forEach((row, index) => {  // check to see if a refund entry exists - fine if it doesn't.
              if (row['Order Number'] == _fineParseStockX?.orderNumber) {
                  rows[index]['Is Cancelled'] = _fineParseStockX.isRefund
                  rows[index]['Purchase Date'] = _fineParseStockX.date
                  rows[index].save()
                  console.log("sheet updated")
                  refundEmailMatched = true
              }
            })
            if (!refundEmailMatched) {
              console.log("refund email here, but no delivery/confirmation entry....creating refund row and marking confirmed")
              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseStockX.styleID, 
                      "Size": _fineParseStockX.size, 
                      "Title": _fineParseStockX.title, 
                      "Condition": _fineParseStockX.condition, 
                      "Order Number": _fineParseStockX.orderNumber, 
                      "Purchase Price": _fineParseStockX.purchasePrice, 
                      "Processing Fee": _fineParseStockX.processingFee, 
                      "Shipping": _fineParseStockX.shipping, 
                      "Total Payment": _fineParseStockX.totalPayment, 
                      "Is Cancelled": _fineParseStockX.isRefund, 
                      "Purchase Date": _fineParseStockX.date
                  }])
                  console.log("sheet updated")
          }
            
          

          } else { //not a confirmed or delivery email
              console.log("email received but not a confirmation or delivery")
          }}
    }
  }

    function formatfineParseGoatForSheetsAdd(_fineParse) {
      if (_fineParse?.hasStorageEmail){
        return { // delivery email...
          "Style ID": _fineParse.styleID, 
          "Size": _fineParse.size, 
          "Title": _fineParse.title, 
          "Condition": _fineParse.condition, 
          "Order Number": _fineParse.orderNumber, 
          "Sub Total": _fineParse.subTotal, 
          "Shipping": _fineParse.shipping, 
          "Goat Credit": _fineParse.goatCredit, 
          "Total Paid": _fineParse.totalPaid, 
          "hasConfirmedEmail": _fineParse.hasConfirmedEmail, 
          "hasStorageEmail": _fineParse.hasStorageEmail, 
          "Delivery Date": _fineParse.date,
          "Delivery Confirmed": _fineParse.hasStorageEmail
        }
      } else if (_fineParse?.hasConfirmedEmail) { //confirmation email...
        return { 
          "Style ID": _fineParse.styleID, 
          "Size": _fineParse.size, 
          "Title": _fineParse.title, 
          "Condition": _fineParse.condition, 
          "Order Number": _fineParse.orderNumber, 
          "Sub Total": _fineParse.subTotal, 
          "Shipping": _fineParse.shipping, 
          "Goat Credit": _fineParse.goatCredit, 
          "Total Paid": _fineParse.totalPaid, 
          "hasConfirmedEmail": _fineParse.hasConfirmedEmail, 
          "hasStorageEmail": _fineParse.hasStorageEmail, 
          // "Delivery Date": _fineParse.date,
          "Purchase Date": _fineParse.date
        }
      } 
      // Uncomment this and adjust when making Goat Refund reader 
      // else { //refund email
      //   return { 
      //     "Style ID": _fineParseStockX.styleID, 
      //     "Size": _fineParseStockX.size, 
      //     "Title": _fineParseStockX.title, 
      //     "Condition": _fineParseStockX.condition, 
      //     "Order Number": _fineParseStockX.orderNumber, 
      //     "Purchase Price": _fineParseStockX.purchasePrice, 
      //     "Processing Fee": _fineParseStockX.processingFee, 
      //     "Shipping": _fineParseStockX.shipping, 
      //     "Total Payment": _fineParseStockX.totalPayment, 
      //     "Is Cancelled": _fineParseStockX.isRefund, 
      //     "hasDeliveredEmail": _fineParseStockX.hasDeliveredEmail, 
      //     "Purchase Date": _fineParseStockX.date
      //   }
      // }
    }

    function formatfineParseStockXForSheetsAdd(_fineParseStockX){ //for aligning properties with column titles
      if (_fineParseStockX?.hasDeliveredEmail){
        return { // delivery email...
          "Style ID": _fineParseStockX.styleID, 
          "Size": _fineParseStockX.size, 
          "Title": _fineParseStockX.title, 
          "Condition": _fineParseStockX.condition, 
          "Order Number": _fineParseStockX.orderNumber, 
          "Purchase Price": _fineParseStockX.purchasePrice, 
          "Processing Fee": _fineParseStockX.processingFee, 
          "Shipping": _fineParseStockX.shipping, 
          "Total Payment": _fineParseStockX.totalPayment, 
          "hasConfirmedEmail": _fineParseStockX.hasConfirmedEmail, 
          "hasDeliveredEmail": _fineParseStockX.hasDeliveredEmail, 
          "Delivery Date": _fineParseStockX.date
        }
      } else if (_fineParseStockX?.hasConfirmedEmail) { //confirmation email...
        return { 
          "Style ID": _fineParseStockX.styleID, 
          "Size": _fineParseStockX.size, 
          "Title": _fineParseStockX.title, 
          "Condition": _fineParseStockX.condition, 
          "Order Number": _fineParseStockX.orderNumber, 
          "Purchase Price": _fineParseStockX.purchasePrice, 
          "Processing Fee": _fineParseStockX.processingFee, 
          "Shipping": _fineParseStockX.shipping, 
          "Total Payment": _fineParseStockX.totalPayment, 
          "hasConfirmedEmail": _fineParseStockX.hasConfirmedEmail, 
          "hasDeliveredEmail": _fineParseStockX.hasDeliveredEmail, 
          "Purchase Date": _fineParseStockX.date
        }
      } else { //refund email
        return { 
          "Style ID": _fineParseStockX.styleID, 
          "Size": _fineParseStockX.size, 
          "Title": _fineParseStockX.title, 
          "Condition": _fineParseStockX.condition, 
          "Order Number": _fineParseStockX.orderNumber, 
          "Purchase Price": _fineParseStockX.purchasePrice, 
          "Processing Fee": _fineParseStockX.processingFee, 
          "Shipping": _fineParseStockX.shipping, 
          "Total Payment": _fineParseStockX.totalPayment, 
          "Is Cancelled": _fineParseStockX.isRefund, 
          "hasDeliveredEmail": _fineParseStockX.hasDeliveredEmail, 
          "Purchase Date": _fineParseStockX.date
        }
      }
    }

    if (website == "StockX") {
      iterateAndAddSinglesStockX()
    }
    if (website == "Goat") {
      iterateAndAddSinglesGoat()
    }
    
    console.log("Bulk: ", bulkArray)

    let formattedBulkArray = []
    bulkArray.forEach(_fineParse => {
      if (_fineParse?.orderNumber){ //ignore unkowns
        if (website == "StockX") {
          formattedBulkArray.push(formatfineParseStockXForSheetsAdd(_fineParse))
        }
        if (website == "Goat") {
          formattedBulkArray.push(formatfineParseGoatForSheetsAdd(_fineParse))
        }
      }
    })
    const moreRows = await sheet.addRows(formattedBulkArray)

    console.log("Done adding rows")
    rows.save
    return true
}

function getImageFromGoatEmail(html){
  let res
  let splitArray = html.split('<img src="')
  splitArray.forEach(line => {
    if (line.includes("product_template_pictures")){
      let largeLine = line
      let end = largeLine.indexOf('" width="')
      let justImage = largeLine.slice(0,end)
      console.log("🚀 ~ file: emailV2.js ~ line 678 ~ getImageFromGoatEmail ~ justImage", justImage)
      res = justImage
    }
  })
  return res
}

function getImageFromStockX(html){
  let res
  let splitArray = html.split('src="')
  splitArray.forEach(line => {
    if (line.includes("images.stockx.com")) {
      let targetLine = line
      let end = targetLine.indexOf("?fit=")
      let justImage = targetLine.slice(0, end)
      console.log("🚀 ~ file: emailV2.js ~ line 694 ~ getImageFromStockX ~ justImage", justImage)
      res = justImage
    }
  })
  return res
}

export default async (req, res) => {
  
    if (req.method === 'GET') {
      let count = 0
      let readCount = 0
      var startTime = performance.now()
        async function getEmails() {

            try {
              const imap = new Imap(imapConfig);
              imap.once('ready', () => {
                imap.openBox('INBOX', false, () => {
                  imap.search(['UNSEEN', ['SINCE', oneMonthsAgo()]], (err, results) => {
                    console.log("🚀 ~ file: emailV2.js ~ line 658 ~ imap.search ~ results", results)
                    const limitedResults = results.slice(0, maxEmailsAtOnce)
                    console.log("🚀 ~ file: emailV2.js ~ line 660 ~ imap.search ~ limitedResults", limitedResults)

                    // const f = imap.fetch(results, {bodies: ''});
                    const f = imap.fetch(limitedResults, {bodies: ''});
                    f.on('message', msg => {
                      msg.on('body', stream => {
                        // MAIN
                        simpleParser(stream, async (err, parsed) => {
                          // const {from, subject, textAsHtml, text, date} = parsed;
                          
                          if (parsed?.text?.includes("GOAT")) { //handle GOAT emails here
                            let _largeScaleParseGoat = largeScaleParseGoat(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                            let _fineParseGoat = fineParseGoat(_largeScaleParseGoat, parsed.subject)
                            console.log("🚀 ~ file: emailV2.js ~ line 632 ~ simpleParser ~ _fineParseGoat", _fineParseGoat)
                            if (_fineParseGoat?.orderNumber){ //ignore 'unknowns'
                              _fineParseGoat.image = getImageFromGoatEmail(parsed.html)//set image from email html
                              _fineParseGoatList.push(_fineParseGoat)
                            }
                          }

                          if (parsed?.text?.includes("StockX")) { //handle StockX emails here
                              console.log("found a stockX email...", parsed.subject, subtractHours(4, parsed.date)) //4 hours because udt time.  client wants est time.
                              let _largeScaleParseStockX = largeScaleParseStockX(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                              let _fineParseStockX = fineParseStockX(_largeScaleParseStockX)
                              if (_fineParseStockX?.orderNumber){ //ignore 'unknowns'
                                _fineParseStockX.image = getImageFromStockX(parsed.html) //get image from email html
                                _fineParseStockXList.push(_fineParseStockX)
                              }
                              console.log("🚀 ~ file: emailV2.js ~ line 196 ~ simpleParser ~ _fineParseStockXList", _fineParseStockXList)
                          } 

                          /* Make API call to save the data
                             Save the retrieved data into a database.
                             E.t.c
                          */
                        });
                      });
                      msg.once('attributes', attrs => {
                        const {uid} = attrs;
                        readCount ++
                        if (readCount <= maxEmailsAtOnce) { //limit the emails scanned at once
                          imap.addFlags(uid, ['\\Seen'], () => {// Mark the email as read after reading it
                            count ++
                            console.log('Marked as read!');
                          });
                        }
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

          let _fineParseStockXList = [] // all StockX objects that will need to be added to Sheets
          let _fineParseGoatList = [] // all GOAT objects that will need to be added to Sheets
          let connectionEnded = false
          const emails = await getEmails()
          while (!connectionEnded) {
            await new Promise(r => setTimeout(r, 1000));
          }
          if (connectionEnded) {
            // UPDATE SHEET
            if (_fineParseStockXList?.length > 0) {
              let sheetUpdateStockX = await updateSheets(_fineParseStockXList, "StockX")
              console.log("🚀 ~ file: emailV2.js ~ line 352 ~ _fineParseStockXList", _fineParseStockXList)
            }
            
            if (_fineParseGoatList?.length > 0) {
              let sheetUpdateGoat = await updateSheets(_fineParseGoatList, "Goat")
              console.log("🚀 ~ file: emailV2.js ~ line 500 ~ sheetUpdateGoat", sheetUpdateGoat)
            }
            
            var endTime = performance.now()

            // SEND DISCORD NOTIFICATIONS START------------------------------------------------------
            if (_fineParseStockXList.length > 1) { //handle many StockX
              let sendDiscordMe = await sendWebhookManyStockX(_fineParseStockXList, "975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C")
              console.log("🚀 ~ file: emailV2.js ~ line 364 ~ sendDiscordMe", sendDiscordMe)
              
              if (!testmode){
                let sendDiscordHermes = await sendWebhookManyStockX(_fineParseStockXList, "975584745754878042/nHrt5qw_bY4qlD0KPm8r6g3-3TkDP74f3fNcP0PZTYcjRpuAzR2vJDseaUPTQDbSGcB2")
                console.log("🚀 ~ file: emailV2.js ~ line 366 ~ sendDiscordHermes", sendDiscordHermes)
              }

            }
            if (_fineParseStockXList.length == 1){ //handle 1 StockX
              let sendDiscordMe = await sendWebhook(_fineParseStockXList[0], "975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C") //my own
              console.log("🚀 ~ file: emailV2.js ~ line 373 ~ sendDiscordMe", sendDiscordMe)
              
              if (!testmode) {
                let sendDiscordHermes = await sendWebhook(_fineParseStockXList[0], "975584745754878042/nHrt5qw_bY4qlD0KPm8r6g3-3TkDP74f3fNcP0PZTYcjRpuAzR2vJDseaUPTQDbSGcB2") //my own
                console.log("🚀 ~ file: emailV2.js ~ line 376 ~ sendDiscordHermes", sendDiscordHermes)
              }
            }

            if (_fineParseGoatList.length > 1) { //handle many GOAT
              let sendDiscordMe = await sendWebhookArrayGoat(_fineParseGoatList, "975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C")
              console.log("🚀 ~ file: emailV2.js ~ line 364 ~ sendDiscordMe", sendDiscordMe)
              
              if (!testmode){
                let sendDiscordHermes = await sendWebhookArrayGoat(_fineParseGoatList, "975584745754878042/nHrt5qw_bY4qlD0KPm8r6g3-3TkDP74f3fNcP0PZTYcjRpuAzR2vJDseaUPTQDbSGcB2")
                console.log("🚀 ~ file: emailV2.js ~ line 366 ~ sendDiscordHermes", sendDiscordHermes)
              }
            }
            if (_fineParseGoatList.length == 1){ //handle 1 GOAT
              let sendDiscordMe = await sendWebhookGoat(_fineParseGoatList[0], "975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C") //my own
              console.log("🚀 ~ file: emailV2.js ~ line 373 ~ sendDiscordMe", sendDiscordMe)
              
              if (!testmode) {
                let sendDiscordHermes = await sendWebhookGoat(_fineParseGoatList[0], "975584745754878042/nHrt5qw_bY4qlD0KPm8r6g3-3TkDP74f3fNcP0PZTYcjRpuAzR2vJDseaUPTQDbSGcB2") //my own
                console.log("🚀 ~ file: emailV2.js ~ line 376 ~ sendDiscordHermes", sendDiscordHermes)
              }
            }

              // SEND DISCORD NOTIFICATIONS END ------------------------------------------------------

            return res.status(200).json({ data: `\nSeconds: ${((endTime - startTime) / 1000).toFixed(2)} \nMarked Read: ${count}` })
          }
    }
  }

  
 
