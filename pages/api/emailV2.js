const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs') // File handling package
import { sendWebhook } from '../../utils/Discord';
import {sendWebhookArrayGoat} from '../../utils/DiscordArrayGoat'
import { sendWebhookGoat} from '../../utils/DiscordGoat'
import { sendWebhookManyStockX } from '../../utils/DiscordArrayStockX'
import {largeScaleParseAliasConsigned, fineParseAliasConsigned, formatDateMMDDYYY, formatDate, lookForMatchConsigned, sendWebhookAliasConsigned } from '../../utils/AliasConsigned'
import {getImageSx, largeScaleParseStockXSoldItem2, lookForMatchStockXSold, sendWebhookStockXSold, largeScaleParseStockXVerification, fineParseStockXVerification, markIsVerifiedInSoldSheet, sendWebhookStockXVerified, largeScaleParseStockXSold, updatePayoutDateInSoldSheet, aioParseStockXCancelledSale} from '../../utils/StockX'
import {getImageFromSx} from '../../utils/General'
import {largeScaleParseAliasCompleted, markIsCompletedInSoldSheet, sendWebhookAliasCompleted} from '../../utils/AliasCompleted'
import { lookForMatchAliasNonConsigned, sendWebhookAliasNonConsigned, fineParseAliasNonConsigned } from '../../utils/AliasSoldNonConsigned'

// #######################################################
let testmode = true //when true= only i get discord hooks.  when false, hermes gets too
let maxEmailsAtOnce = 4 //set the max number of emails to read on each api request. Helpful when limited timeout.
// #######################################################

// Globals Start ------------------------
const MY_WEBHOOK = '975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C'
const HERMES_WEBHOOK = '975584745754878042/nHrt5qw_bY4qlD0KPm8r6g3-3TkDP74f3fNcP0PZTYcjRpuAzR2vJDseaUPTQDbSGcB2'
// Globals End ------------------------


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

async function sendWebhookStockXCancelled(_fineParseArray, webhookUrl) { 
        
  function hexToDecimal(hex) {
      return parseInt(hex.replace("#",""), 16)
  }

  let allEmbeds = []
  _fineParseArray.forEach(_fineParse => {
      var myEmbed = {
          author: {
            name: "New StockX Email Detected",
          },
          // thumbnail: { url:  _fineParse.image},
          title: _fineParse.title,
          description: 
              `Order: ########-####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 5)}\nEmail Type: Sale Canceled`,
             
          color: hexToDecimal("#5B9D66"),
          timestamp: new Date()
      }

      allEmbeds.push(myEmbed)
    
  })   

  var myHeaders = new Headers();
  myHeaders.append("authority", "discord.com");
  myHeaders.append("accept", "*/*");
  myHeaders.append("accept-language", "en-US,en;q=0.9");
  myHeaders.append("content-type", "application/json");
  myHeaders.append("origin", "https://dev.to");
  myHeaders.append("referer", "https://dev.to/");
  myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"");
  myHeaders.append("sec-ch-ua-mobile", "?0");
  myHeaders.append("sec-ch-ua-platform", "\"macOS\"");
  myHeaders.append("sec-fetch-dest", "empty");
  myHeaders.append("sec-fetch-mode", "cors");
  myHeaders.append("sec-fetch-site", "cross-site");

    var raw = JSON.stringify({
      username: "StockX Importer",
      embeds: allEmbeds,
      avatar_url: "https://i.imgur.com/fYrDHMk.png",
  })
  
  var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
  };

  var messageDiscord =  await fetch("https://discord.com/api/webhooks/" + webhookUrl, requestOptions)

  console.log("🚀 ~ file: StockXSold.js ~ line 282 ~ sendWebhookStockXSold ~ messageDiscord.status", messageDiscord.status)

  return messageDiscord.status
}

async function updateCanceledInSoldSheet(doc, _fineParseAliasComplete){
  await doc.loadInfo();
  let soldSheet = doc.sheetsByTitle["Sold"]
  const rows = await soldSheet.getRows()

  let justOrderNums = []
  _fineParseAliasComplete?.forEach(item => {
      justOrderNums.push(item["orderNumber"])
  })

  rows.forEach(async (row, index) => {
      if (justOrderNums?.includes(row["Order Number"])){
          console.log("found a match for StockX Cancelled Order ")
          let indexNumber = justOrderNums?.indexOf(row["Order Number"])
          let fullItem = _fineParseAliasComplete[indexNumber]
          rows[index]["Date Cancelled"] = fullItem.date
          rows[index]["Calc Average"] = rows[index]["Calc Average"].formula
          rows[index].save()
      }

  })
}

async function sendWebhookStockXPayout(_fineParseArray, webhookUrl) { 
        
  function hexToDecimal(hex) {
      return parseInt(hex.replace("#",""), 16)
  }

  let allEmbeds = []
  _fineParseArray.forEach(_fineParse => {
      var myEmbed = {
          author: {
            name: "New StockX Email Detected",
          },
          thumbnail: { url:  _fineParse.image},
          title: _fineParse.title,
          description: 
              `Style ID: ${_fineParse.styleID}\nOrder: ########-####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 5)}\nSale Price: ${_fineParse.salePrice}\nTotal Payout: ${_fineParse.totalPayout}\nEmail Type:💸 Payout Sent`,
             
          color: hexToDecimal("#5B9D66"),
          timestamp: new Date()
      }

      allEmbeds.push(myEmbed)
    
  })   

  



  var myHeaders = new Headers();
  myHeaders.append("authority", "discord.com");
  myHeaders.append("accept", "*/*");
  myHeaders.append("accept-language", "en-US,en;q=0.9");
  myHeaders.append("content-type", "application/json");
  myHeaders.append("origin", "https://dev.to");
  myHeaders.append("referer", "https://dev.to/");
  myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"");
  myHeaders.append("sec-ch-ua-mobile", "?0");
  myHeaders.append("sec-ch-ua-platform", "\"macOS\"");
  myHeaders.append("sec-fetch-dest", "empty");
  myHeaders.append("sec-fetch-mode", "cors");
  myHeaders.append("sec-fetch-site", "cross-site");

    var raw = JSON.stringify({
      username: "StockX Importer",
      embeds: allEmbeds,
      avatar_url: "https://i.imgur.com/fYrDHMk.png",
  })
  
  var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
  };

  var messageDiscord =  await fetch("https://discord.com/api/webhooks/" + webhookUrl, requestOptions)

  console.log("🚀 ~ file: StockXSold.js ~ line 282 ~ sendWebhookStockXSold ~ messageDiscord.status", messageDiscord.status)

  return messageDiscord.status
}

function subtractHours(numOfHours, date) {
  date.setHours(date.getHours() - numOfHours);
  return date;
}




function oneMonthsAgo(){
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d
}


function cleanUpStyleId(string){
// console.log("🚀 ~ file: emailV2.js ~ line 62 ~ cleanUpStyleId ~ string", string)
  
  let parse1 = string.replaceAll("-", "")
  let parse2 = parse1.trim()
  let parse3 = parse2.replaceAll("/","")
  let parse4 = parse3.replaceAll(" ", "")
  return parse4
}


function fineParseStockXSoldItem2(rawDetails, subject) { // only continue if confirmation or delivery or refund email:
  let fineDetails = {}
  try {
    fineDetails["styleID"] = rawDetails['styleID'].substring(rawDetails.styleID.indexOf(":") + 2, rawDetails.styleID.length)  
  } catch {
    fineDetails["styleID"] = "None"//shoes have style id, but basketball for example wont.
  }
  fineDetails.website = "StockX"
  try {
    fineDetails["size"] = rawDetails['size'].substring(rawDetails.size.indexOf(":") + 2, rawDetails.size.length)  
  } catch {
    fineDetails["size"] = "None" 

  }
  fineDetails["title"] = subject.substring(subject.indexOf("!") + 2, subject.length)
  fineDetails['isSold'] = true
  fineDetails["condition"] = rawDetails['condition']?.substring(rawDetails.condition.indexOf(":") + 2, rawDetails.condition.length)  
  fineDetails["orderNumber"] = rawDetails['orderNumber']?.substring(rawDetails.orderNumber.indexOf(":") + 2, rawDetails.orderNumber.length)  
  fineDetails["salePrice"] = rawDetails['salePrice']?.substring(rawDetails.salePrice.indexOf(": ") + 2, rawDetails.salePrice.length)  
  fineDetails["transactionFee"] = rawDetails['transactionFee']?.substring(rawDetails.transactionFee.indexOf(": ") + 2, rawDetails.transactionFee.length)  
  fineDetails["paymentProc"] = rawDetails['paymentProc']?.substring(rawDetails.paymentProc.indexOf(": ") + 2, rawDetails.paymentProc.length)  
  fineDetails["shipping"] = rawDetails['shipping']?.substring(rawDetails.shipping.indexOf(": ") + 2, rawDetails.shipping.length)  
  fineDetails["totalPayout"] = rawDetails['totalPayout']?.substring(rawDetails.totalPayout?.indexOf("$") + 0, rawDetails.totalPayout.length - 0)
  fineDetails["Calc Average"] = `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(fineDetails["styleID"])}@${fineDetails["size"]}", "Calc Average")`
  console.log("🚀 ~ file: emailV2.js ~ line 345 ~ fineParseStockX ~ fineDetails", fineDetails)


  
  if (rawDetails.dateRetrievedFromStamp){
    fineDetails["date"] = formatDateMMDDYYY (formatDate(rawDetails.date) )
  } else { //retrieved date from body 
    fineDetails["date"] = formatDateMMDDYYY( formatDate(rawDetails['date'].substring(rawDetails.date.indexOf(": ") + 2, rawDetails.date.length )  ) )
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

function goatParseHTML(html){ //style id and title goatParse = {styleID: '', title: '', size: ''}
  let returnObject = {}
  let split = html.split("<a")
  let res1 = []
  split.forEach(line => {
    if (line.includes(" letter-spacing: 2px; line-height: 18px")) {
      res1.push(line)
    }
  })
  let parse1 = res1[1]
  let start = parse1.indexOf('text-decoration: none;"> ')
  let end = parse1.indexOf('zwnj;')
  let parse2 = parse1.slice(start + 25, end-1)
  let styleID = parse2
  returnObject.styleID =  styleID
  console.log("🚀 ~ file: emailV2.js ~ line 766 ~ goatParseHTML ~ parse1", styleID)
  

  let startTitle = parse1.indexOf(`ine-height: 18px; text-transform: uppercase;"`)
  let endTitle = parse1.indexOf(`</td> </tr> </table>`)
  let parse3 = parse1.slice(startTitle + 47, endTitle - 1)
  let parse4 = parse3.replaceAll("<span>", "")
  let parse5 = parse4.replaceAll("</span>", "")
  let parse6 = parse5.replaceAll("&#39", "")
  let parse7 = parse6.replaceAll(";", "'")
  let title = parse7
  returnObject.title =  title
  console.log("🚀 ~ file: emailV2.js ~ line 89 ~ goatParseHTML ~ title", title)

  let sizeParse1 = title.split("Size")
  let sizeParse2 = sizeParse1[1].trim()
  returnObject.size = sizeParse2
  return returnObject
}

function largeScaleParseGoat(_string, subject, date){
  let rawDetails = {}
  
  const splitByLine = _string.split(/\r?\n/)
  let anchorIndexForStorage

  let n = 0
  splitByLine.forEach(line => {
    if (line.includes("Thank you for your order")) {
      rawDetails.type = "Confirmed"
    } if (line.includes("Your sneakers are being stored")) {
      rawDetails.type = "Storage"
    } if (line.includes("what are my options")) {
      anchorIndexForStorage = n
    }
    n ++
  })
  
  rawDetails["date"] = date.toString()
  rawDetails["dateRetrievedFromStamp"] = true

  console.log("🚀 ~ file: emailV2.js ~ line 69 ~ largeScaleParseGoat ~ rawDetails", rawDetails)


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
    rawDetails.totalPaid = splitByLine[indexOfOrderSummary + 1] //set to subtotal because basically, subtotal is the total in any case because I dont pay tax or ship for these 

    // rawDetails.totalPaid = splitByLine[indexOfOrderSummary + 5]

    return rawDetails
  }

  if (rawDetails.type == "Storage") { //in the stored email, some details are not mentioned such as brand, shipping, etc
    let anchorText = anchorIndexForStorage //will probably change
    let styleIDAndTitle = parseStyleIDandTitle(splitByLine[anchorText - 2])
    console.log("🚀 ~ file: emailV2.js ~ line 119 ~ largeScaleParseGoat ~ styleIDAndTitle", styleIDAndTitle)
    rawDetails.styleID = styleIDAndTitle.styleID
    rawDetails.title = styleIDAndTitle.title
    // rawDetails.styleID = splitByLine[anchorText - 2] 
    // rawDetails.title = splitByLine[anchorText - 1] 
    splitByLine.forEach(line => {
      if (line.includes("Order #")){
          rawDetails["orderNumber"] = line
      }
    })
    return rawDetails
  }
}

function parseStyleIDandTitle(_string) {
  let data = {}
  let parse1 = _string.replaceAll("   ", "") //`" MR530SH‌ 530v2 Retro 'Khaki' – Size US 8.5 M"`
  let parse2 = parse1.split(" ") //'"', '', 'MR530SH‌530v2', 'Retro', "'Khaki'", '–', 'Size', 'US', '8.5', 'M"']
  console.log("🚀 ~ file: emailV2.js ~ line 137 ~ parseStyleID ~ parse2", parse2)
  
  let n = 0
  let stopIterating = false
  parse2.forEach( item => {
    if (item.length > 3 && !stopIterating) {
      console.log(n, "we are here")
      let styleID = item.trim()
      console.log("🚀 ~ file: emailV2.js ~ line 144 ~ parseStyleID ~ styleID", styleID)
      let parse3 = parse2.slice(n + 1, parse2.length + 1)
      console.log("🚀 ~ file: emailV2.js ~ line 147 ~ parseStyleID ~ parse3", parse3)
      let title = parse3.join(" ")
      console.log("🚀 ~ file: emailV2.js ~ line 149 ~ parseStyleID ~ title", title)
      data['styleID'] = styleID
      data['title'] = title
      stopIterating = true
      return data
    }
    n ++
  })
  return data
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

function fineParseGoat(rawDetails, subject, parsedGoatHTML) { //only continue if confirmation or storage email
  console.log("🚀 ~ file: emailV2.js ~ line 151 ~ fineParseGoat ~ rawDetails", rawDetails)
  if (
      rawDetails?.type?.includes("Confirmed") //this info is set during largescaleparseGoat
  ) {
    let fineDetails = {}
    fineDetails["styleID"] = "None"//shoes have style id, but basketball for example wont.
    // fineDetails["styleID"] = rawDetails?.styleID 
    fineDetails["styleID"] = parsedGoatHTML?.styleID 
    fineDetails.website = "Goat"
    // fineDetails["title"] = rawDetails['title']
    fineDetails["title"] = parsedGoatHTML?.title
    fineDetails["size"] = rawDetails?.size 
    if (parsedGoatHTML?.size  ){
      fineDetails["size"] = parsedGoatHTML?.size 
    }
    fineDetails["condition"] = rawDetails?.condition 
    fineDetails["orderNumber"] = rawDetails['orderNumber'].substring(rawDetails.orderNumber.indexOf("#") + 1, rawDetails.orderNumber.length)  //Order #476756560 == 476756560
    fineDetails["subTotal"] = rawDetails['subTotal'].substring(rawDetails.subTotal.indexOf("$") + 0, rawDetails.subTotal.length)  
    fineDetails["shipping"] = rawDetails['shipping'].substring(rawDetails.shipping.indexOf("$") + 1, rawDetails.shipping.length)  
    fineDetails["goatCredit"] = rawDetails['goatCredit'].substring(rawDetails.goatCredit.indexOf("goat credit") + 11, rawDetails.goatCredit.length)  
    fineDetails["totalPaid"] = rawDetails['totalPaid'].substring(rawDetails.totalPaid.indexOf("$") + 1, rawDetails.totalPaid.length)  
    
    if (rawDetails.dateRetrievedFromStamp){
      fineDetails["date"] = (rawDetails.date.substring(0,10))
    } else { //retrieved date from body 
      fineDetails["date"] =  formatDateMMDDYYY( formatDate(rawDetails['date'].substring(rawDetails.date.indexOf(": ") + 2, rawDetails.date.length )  ) )
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
    // fineDetails["styleID"] = rawDetails?.styleID 
    fineDetails["styleID"] = parsedGoatHTML?.styleID 
    fineDetails.website = "Goat"
    // fineDetails["title"] = rawDetails['title']
    fineDetails["title"] = parsedGoatHTML?.title 
    if (parsedGoatHTML?.size  ){
      fineDetails["size"] = parsedGoatHTML?.size 
    }
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
    try {
      fineDetails["styleID"] = rawDetails['styleID'].substring(rawDetails.styleID.indexOf(":") + 2, rawDetails.styleID.length)  
    } catch {
      fineDetails["styleID"] = "None"//shoes have style id, but basketball for example wont.
    }
    fineDetails.website = "StockX"
    try {
      fineDetails["size"] = rawDetails['size'].substring(rawDetails.size.indexOf(":") + 2, rawDetails.size.length)  
    } catch {
      fineDetails["size"] = "None" 

    }
    fineDetails["condition"] = rawDetails['condition'].substring(rawDetails.condition.indexOf(":") + 2, rawDetails.condition.length)  
    fineDetails["orderNumber"] = rawDetails['orderNumber'].substring(rawDetails.orderNumber.indexOf(":") + 2, rawDetails.orderNumber.length)  
    fineDetails["purchasePrice"] = rawDetails['purchasePrice'].substring(rawDetails.purchasePrice.indexOf(": ") + 2, rawDetails.purchasePrice.length)  
    fineDetails["processingFee"] = rawDetails['processingFee'].substring(rawDetails.processingFee.indexOf(": ") + 2, rawDetails.processingFee.length)  
    fineDetails["shipping"] = rawDetails['shipping'].substring(rawDetails.shipping.indexOf(": ") + 2, rawDetails.shipping.length)  
    fineDetails["totalPayment"] = rawDetails['totalPayment'].substring(rawDetails.totalPayment.indexOf("$") + 0, rawDetails.totalPayment.length - 1)
    fineDetails["Calc Average"] = `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(fineDetails["styleID"])}@${fineDetails["size"]}", "Calc Average")`
    console.log("🚀 ~ file: emailV2.js ~ line 345 ~ fineParseStockX ~ fineDetails", fineDetails)


    
    if (rawDetails.dateRetrievedFromStamp){
      fineDetails["date"] = formatDateMMDDYYY (formatDate(rawDetails.date) )
    } else { //retrieved date from body 
      fineDetails["date"] = formatDateMMDDYYY( formatDate(rawDetails['date'].substring(rawDetails.date.indexOf(": ") + 2, rawDetails.date.length )  ) )
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
    console.log("UPDATING UNSOLD GOAT <-----------------------------------------")
    let unsoldGoat = doc.sheetsByTitle["Unsold GOAT"] //goat unsold tab - used only for GOAT, when shoe is stored - can be written into unsold tab.

    var currentTime = new Date()
    var year = currentTime.getFullYear()
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
          "Delivery Date": formatDateMMDDYYY(`${ entireRow["Delivery Date"]} ${year}`), 
          "Delivery Confirmed": entireRow["Delivery Confirmed"],    
          "Platform": entireRow["Platform"]
      },
  
  ])  
    console.log("🚀 ~ file: emailV2.js ~ line 408 ~ updateUnsoldGoatRow ~ moreRows", moreRows)
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
              let entireRow = rows[index]//._rawData fpr just values
              if (row['Order Number'] == _fineParseGoat?.orderNumber) {
                  rows[index]['hasStorageEmail'] = _fineParseGoat.hasStorageEmail
                  rows[index]['Delivery Date'] = _fineParseGoat.date
                  rows[index]['Delivery Confirmed'] = _fineParseGoat.hasStorageEmail
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
                      "Delivery Date": _fineParseGoat.date,
                      "Platform": _fineParseGoat.website,
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
                      "Purchase Date": _fineParseGoat.date,
                      "Platform": _fineParseGoat.website,
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
// ------------------------------------stockx below---------------------------------------------------------------------------
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
                  rows[index]['Platform'] = _fineParseStockX.website
                  rows[index]['Calc Average'] = _fineParseStockX['Calc Average']
                  rows[index].save()
                  console.log("sheet updated")
                  deliveredEmailMatched = true
              }
          })
  
          if (!deliveredEmailMatched) {// if a confirmed entry does not exist, then insert one but label it for delivery too
              console.log("delivery email here, but no confirmation entry....creating confirm row and marking delivered")
              console.log("🚀 ~ 1111111111111-------------------------", _fineParseStockX)

              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseStockX.styleID, 
                      "Size": _fineParseStockX.size, 
                      "Calc Average": _fineParseStockX['Calc Average'],
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
                      "Delivery Date": _fineParseStockX.date,
                      "Platform": _fineParseStockX.website,
                  }])
                  console.log("sheet updated")
          }
  
      } else if (_fineParseStockX?.hasConfirmedEmail) { //dealing with confirmed entry
          let confirmedEmailMatched = false
          rows.forEach((row, index) => {  // check to see if a confirmed entry exists - fine if it doesnt.
              if (row['Order Number'] == _fineParseStockX?.orderNumber) {
                  rows[index]['hasConfirmedEmail'] = _fineParseStockX.hasConfirmedEmail
                  rows[index]['Purchase Date'] = _fineParseStockX.date
                  rows[index]['Platform'] = _fineParseStockX.website
                  rows[index].save()
                  console.log("sheet updated")
                  confirmedEmailMatched = true
              }
          })
  
          if (!confirmedEmailMatched) {
              console.log("confirmed email here, but no delivery entry....creating confirm row and marking confirmed")
              console.log("🚀 ~ 2222222222----------------", _fineParseStockX)

              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseStockX.styleID, 
                      "Size": _fineParseStockX.size, 
                      "Calc Average": _fineParseStockX['Calc Average'],
                      "Title": _fineParseStockX.title, 
                      "Condition": _fineParseStockX.condition, 
                      "Order Number": _fineParseStockX.orderNumber, 
                      "Purchase Price": _fineParseStockX.purchasePrice, 
                      "Processing Fee": _fineParseStockX.processingFee, 
                      "Shipping": _fineParseStockX.shipping, 
                      "Total Payment": _fineParseStockX.totalPayment, 
                      "hasConfirmedEmail": _fineParseStockX.hasConfirmedEmail, 
                      "Purchase Date": _fineParseStockX.date,
                      "Platform": _fineParseStockX.website,
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
              console.log("🚀 ~ ----------------------------------", _fineParseStockX)

              const moreRows = await sheet.addRows([
                  { 
                      "Style ID": _fineParseStockX.styleID, 
                      "Size": _fineParseStockX.size, 
                      "Calc Average": _fineParseStockX['Calc Average'],
                      "Title": _fineParseStockX.title, 
                      "Condition": _fineParseStockX.condition, 
                      "Order Number": _fineParseStockX.orderNumber, 
                      "Purchase Price": _fineParseStockX.purchasePrice, 
                      "Processing Fee": _fineParseStockX.processingFee, 
                      "Shipping": _fineParseStockX.shipping, 
                      "Total Payment": _fineParseStockX.totalPayment, 
                      "Is Cancelled": _fineParseStockX.isRefund, 
                      "Purchase Date": _fineParseStockX.date,
                      "Platform": _fineParseStockX.website,
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
          "Delivery Confirmed": _fineParse.hasStorageEmail,
          "Platform": _fineParse.website
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
          "Purchase Date": _fineParse.date,
          "Platform": _fineParse.website
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
          "Calc Average": _fineParseStockX['Calc Average'],
          "Title": _fineParseStockX.title, 
          "Condition": _fineParseStockX.condition, 
          "Order Number": _fineParseStockX.orderNumber, 
          "Purchase Price": _fineParseStockX.purchasePrice, 
          "Processing Fee": _fineParseStockX.processingFee, 
          "Shipping": _fineParseStockX.shipping, 
          "Total Payment": _fineParseStockX.totalPayment, 
          "hasConfirmedEmail": _fineParseStockX.hasConfirmedEmail, 
          "hasDeliveredEmail": _fineParseStockX.hasDeliveredEmail, 
          "Delivery Date": _fineParseStockX.date,
          "Platform": _fineParseStockX.website
        }
      } else if (_fineParseStockX?.hasConfirmedEmail) { //confirmation email...
        return { 
          "Style ID": _fineParseStockX.styleID, 
          "Size": _fineParseStockX.size, 
          "Calc Average": _fineParseStockX['Calc Average'],
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
          "Platform": _fineParseStockX.website
        }
      } else { //refund email
        return { 
          "Style ID": _fineParseStockX.styleID, 
          "Size": _fineParseStockX.size, 
          "Calc Average": _fineParseStockX['Calc Average'],
          "Title": _fineParseStockX.title, 
          "Condition": _fineParseStockX.condition, 
          "Order Number": _fineParseStockX.orderNumber, 
          "Purchase Price": _fineParseStockX.purchasePrice, 
          "Processing Fee": _fineParseStockX.processingFee, 
          "Shipping": _fineParseStockX.shipping, 
          "Total Payment": _fineParseStockX.totalPayment, 
          "Is Cancelled": _fineParseStockX.isRefund, 
          "hasDeliveredEmail": _fineParseStockX.hasDeliveredEmail, 
          "Purchase Date": _fineParseStockX.date,
          "Platform": _fineParseStockX.website
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
  splitArray.reverse().forEach(line => { //reversed because multiple images in  email, and reversed order gives primary image first.
    if (line.includes("images.stockx.com")) {
      let targetLine = line
      let end = targetLine.indexOf('"')
      let justImage = targetLine.slice(0, end)
      console.log("🚀 ~ file: emailV2.js ~ line 694 ~ getImageFromStockX ~ justImage", justImage)
      res = justImage
    }
  })
  return res
}

function largeScaleParseStockXPayout(_string, subject, date){
  const splitByLine = _string.split(/\r?\n/)
  console.log("🚀 ~ file: StockX.js ~ line 108 ~ largeScaleParseStockXSoldItem2 ~ splitByLine", splitByLine)
  let rawDetails = {}
  splitByLine.forEach((line, index) => {
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
      if (line.includes("Sale Price:")){
          rawDetails["salePrice"] = line
      }
      if (line.includes("Transaction Fee:")){
          rawDetails["transactionFee"] = line
      }
      if (line.includes("Payment Proc.")){
          rawDetails["paymentProc"] = line
      }
      if (line.includes("Shipping:")){
          rawDetails["shipping"] = line
      }
      if (line.toLowerCase().includes("payout")){
          rawDetails["totalPayout"] = line
      }
      rawDetails["title"] = subject.substring(subject.indexOf("Payout Sent:") + 13, subject.length)
      
      // if (line.includes("Ready For Authentication")){
      //     rawDetails["title"] = splitByLine[index + 1]
      // }
      
      rawDetails['subject'] = subject
  
      if (line.includes("Date:")){
          rawDetails["date"] = line
      } else { //cannot parse date, meaning it was an auto forward, and date is from parsed.date
          rawDetails["date"] = date.toString()
          rawDetails["dateRetrievedFromStamp"] = true
      }
  })
  return rawDetails
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
                            let parsedGoatHTML = goatParseHTML(parsed.html) //used for title, size, style id
                            let _largeScaleParseGoat = largeScaleParseGoat(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                            let _fineParseGoat = fineParseGoat(_largeScaleParseGoat, parsed.subject, parsedGoatHTML)
                            console.log("🚀 ~ file: emailV2.js ~ line 632 ~ simpleParser ~ _fineParseGoat", _fineParseGoat)
                            if (_fineParseGoat?.orderNumber){ //ignore 'unknowns'
                              _fineParseGoat.image = getImageFromGoatEmail(parsed.html)//set image from email html
                              _fineParseGoatList.push(_fineParseGoat)
                            }
                          }

                          if (parsed?.text?.includes("StockX") && (parsed?.subject?.includes("Canceled"))) {
                              console.log("Found a StockX Email: Sale Canceled")
                              let aioParse = aioParseStockXCancelledSale(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                              console.log("🚀 ~ file: emailV2.js ~ line 1048 ~ simpleParser ~ aioParse", aioParse)

                              if (aioParse?.orderNumber) {//ignore 'unknowns'
                                aioParseList.push(aioParse)
                              }
                          }

                          if (parsed?.text?.includes("StockX") && (parsed?.subject?.includes("Payout Sent"))){ //stockx payout sent
                            console.log("Found a StockX Email: Payout Sent")
                            let _largeScaleParsePayoutSent = largeScaleParseStockXPayout(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                            console.log("🚀 ~ file: emailV2.js ~ line 939 ~ simpleParser ~ _largeScaleParsePayoutSent", _largeScaleParsePayoutSent)

                            let _fineParseStockXPayout = fineParseStockXVerification(_largeScaleParsePayoutSent, parsed?.subject)
                            console.log("🚀 ~ file: emailV2.js ~ line 992 ~ simpleParser ~ _fineParseStockXPayout", _fineParseStockXPayout)

                            if (_fineParseStockXPayout?.orderNumber) {//ignore 'unknowns'
                              _fineParseStockXPayout.image = getImageFromStockX(parsed.html) //get image from email html
                              _fineParseStockXPayoutList.push(_fineParseStockXPayout)
                            }

                          }

                          if (parsed?.text?.includes("StockX") && (parsed?.subject?.includes("Item Arrived For Verification"))){ //Stockx verification email
                              console.log("Found a StockX email: an item you are selling arrived at SX for verifiction.")

                              let _largeScaleParseStockXVerificationArrived = largeScaleParseStockXVerification(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                              console.log("🚀 ~ file: emailV2.js ~ line 940 ~ simpleParser ~ _largeScaleParseStockXVerificationArrived", _largeScaleParseStockXVerificationArrived)
                              
                              let _fineScaleParseStockXVerificationArrived = fineParseStockXVerification(_largeScaleParseStockXVerificationArrived, parsed?.subject)
                              console.log("🚀 ~ file: emailV2.js ~ line 943 ~ simpleParser ~ _fineScaleParseStockXVerificationArrived", _fineScaleParseStockXVerificationArrived)

                              if (_fineScaleParseStockXVerificationArrived?.orderNumber) {//ignore 'unknowns'
                                _fineScaleParseStockXVerificationArrived.image = getImageFromStockX(parsed.html) //get image from email html
                                _fineScaleParseStockXVerificationArrivedList.push(_fineScaleParseStockXVerificationArrived)
                              }
                          }

                          if (parsed?.text?.includes("StockX") && (parsed?.subject?.includes("You Sold Your Item"))){ //SX Sold Item
                              console.log("Found a StockX Sold Item Email...")
                              let _largeScaleParseStockXSoldItem = largeScaleParseStockXSold(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                              console.log("🚀 ~ file: emailV2.js ~ line 889 ~ simpleParser ~ _largeScaleParseStockXSoldItem", _largeScaleParseStockXSoldItem)

                              let _fineParseStockXSoldItem = fineParseStockXSoldItem2(_largeScaleParseStockXSoldItem, parsed?.subject)
                              console.log("🚀 ~ file: emailV2.js ~ line 892 ~ simpleParser ~ _fineParseStockXSoldItem", _fineParseStockXSoldItem)

                              if (_fineParseStockXSoldItem?.orderNumber) {//ignore 'unknowns'
                                _fineParseStockXSoldItem.image = getImageFromStockX(parsed.html) //get image from email html
                                _fineParseStockXSoldItemList.push(_fineParseStockXSoldItem)
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

                          if (parsed?.text?.includes("alias") && parsed?.text?.includes("consigned")){ //handle alias consigned here
                            console.log("found an alias consigned email....")
                            let _largeScaleParseAliasConsigned = await largeScaleParseAliasConsigned(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                            console.log("🚀 ~ file: emailV2.js ~ line 900 ~ simpleParser ~ _largeScaleParseAliasConsigned", _largeScaleParseAliasConsigned)

                            let _fineParseAliasConsigned = fineParseAliasConsigned(_largeScaleParseAliasConsigned)
                            console.log("🚀 ~ file: emailV2.js ~ line 893 ~ simpleParser ~ _fineParseAliasConsigned", _fineParseAliasConsigned)

                            if (_fineParseAliasConsigned?.orderNumber){ //ignore 'unknowns'
                              _fineParseAliasConsigned.image = await getImageFromSx(_fineParseAliasConsigned.styleID) 
                              _fineParseAliasConsignedList.push(_fineParseAliasConsigned)
                            }
                        }


                        if (parsed?.text?.includes("alias") && parsed?.subject?.includes("Sold") && parsed?.subject?.indexOf('consigned') === -1){ //handle alias non consigned here
                          console.log("found an alias non-consigned email....")

                          let _largeScalePArsedAliasNonConsigned = await largeScaleParseAliasConsigned(parsed.text, parsed.subject, subtractHours(4, parsed.date))
                          console.log("🚀 ~ file: emailV2.js ~ line 914 ~ simpleParser ~ _largeScalePArsedAliasNonConsigned", _largeScalePArsedAliasNonConsigned)
                          // lookForMatchAliasNonConsigned

                          let _fineParseAliasNonConsigned = fineParseAliasNonConsigned(_largeScalePArsedAliasNonConsigned)
                          console.log("🚀 ~ file: emailV2.js ~ line 919 ~ simpleParser ~ _fineParseAliasNonConsigned", _fineParseAliasNonConsigned)

                          if (_fineParseAliasNonConsigned?.orderNumber){ //ignore 'unknowns'
                            _fineParseAliasNonConsigned.image = await getImageFromSx(_fineParseAliasNonConsigned.styleID) 
                            _fineParseAliasNonConsignedList.push(_fineParseAliasNonConsigned)
                          }

                        }

                          if (parsed?.text?.includes("alias") && parsed?.subject?.includes("Completed")) {//handle completed Alias emails (consigned and not).  Currently only looking for order number matches within the SALES sheet.
                            console.log("found an alias completed email....")
                            let _largeScaleParseAliasCompleted = await largeScaleParseAliasCompleted(parsed.subject, subtractHours(4, parsed.date))
                            console.log("🚀 ~ file: emailV2.js ~ line 913 ~ simpleParser ~ _largeScaleParseAliasCompleted", _largeScaleParseAliasCompleted)
                            
                            // no fineparse needed here
                            if (_largeScaleParseAliasCompleted?.orderNumber){ //ignore 'unknowns'
                              _fineParseAliasComplete.push(_largeScaleParseAliasCompleted)
                            }
                          
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
          // WIP*
          let _fineParseStockXList = [] // all StockX objects that will need to be added to Sheets
          let _fineParseGoatList = [] // all GOAT objects that will need to be added to Sheets
          let _fineParseAliasConsignedList = [] //Alias consigned
          let _fineParseAliasComplete = [] //Alias complete
          let _fineParseAliasNonConsignedList = []
          let _fineParseStockXSoldItemList = []
          let _fineScaleParseStockXVerificationArrivedList = []
          let _fineParseStockXPayoutList = []
          let aioParseList = []//cancelled stockx
          let connectionEnded = false
          const emails = await getEmails()
          while (!connectionEnded) {
            await new Promise(r => setTimeout(r, 1000));
          }



          if (connectionEnded) {
            // UPDATE SHEET start ------------------------------
            if (_fineParseStockXList?.length > 0) {
              let sheetUpdateStockX = await updateSheets(_fineParseStockXList, "StockX")
              console.log("🚀 ~ file: emailV2.js ~ line 352 ~ _fineParseStockXList", _fineParseStockXList)
              // discord sent far down
            }

            if (_fineParseStockXSoldItemList?.length > 0) {
                // look in unsold sx for the same styleId + size
                // if match, then mark the item sold and create new entry in sold sheet using unsold row + sold email dets
                // if no match, create a new entry in sold sheet using only email dets
                // send discord webhook.
                let lookForMatchesAndUpdateSheetStockXSold = await lookForMatchStockXSold(doc, _fineParseStockXSoldItemList)

                let sendDiscordStockXSoldMe = await sendWebhookStockXSold(_fineParseStockXSoldItemList, MY_WEBHOOK)
                if (!testmode){
                  let sendDiscordHermes = await sendWebhookStockXSold(_fineParseStockXSoldItemList, HERMES_WEBHOOK)
                }
            }
            
            if (_fineParseGoatList?.length > 0) {
              let sheetUpdateGoat = await updateSheets(_fineParseGoatList, "Goat")
              console.log("🚀 ~ file: emailV2.js ~ line 500 ~ sheetUpdateGoat", sheetUpdateGoat)
              // discord sent far down
            }

            if (_fineParseAliasConsignedList?.length > 0) {
              // try to find a match in unsold consigned, if no match then add to sold sheet with email dets.  If match then add to sold sheet with unsold consigned row dets + email dets
              let lookForMatchesAndUpdateSheet = await lookForMatchConsigned(doc, _fineParseAliasConsignedList) 
              // send discord webhook
              let sendDiscordMe = await sendWebhookAliasConsigned(_fineParseAliasConsignedList, MY_WEBHOOK)
              if (!testmode){
                let sendDiscordHermes = await sendWebhookAliasConsigned(_fineParseAliasConsignedList, HERMES_WEBHOOK)
              }
            }

            if (_fineParseAliasNonConsignedList?.length > 0) {//Alias Non consigned 
              let lookForMatchesAndUpdateSheet = await lookForMatchAliasNonConsigned(doc, _fineParseAliasNonConsignedList) 
              // send discord webhook
              let sendDiscordMe = await sendWebhookAliasNonConsigned(_fineParseAliasNonConsignedList, MY_WEBHOOK)
              if (!testmode){
                let sendDiscordHermes = await sendWebhookAliasNonConsigned(_fineParseAliasNonConsignedList, HERMES_WEBHOOK)
              }
            }

            if (_fineParseAliasComplete?.length > 0) {
              // mark is completed true for that order # in sold sheet.
              let _markIsCompletedInSoldSheet = await markIsCompletedInSoldSheet(doc, _fineParseAliasComplete)
              // send discord webhook
              let sendDiscordMe = await sendWebhookAliasCompleted(_fineParseAliasComplete, MY_WEBHOOK)
              if (!testmode) {
                  let sendDiscordHermes = await sendWebhookAliasCompleted(_fineParseAliasComplete, HERMES_WEBHOOK)
              }
            }

            if (_fineScaleParseStockXVerificationArrivedList?.length > 0) {
              // mark is verified true for that order # in the sold sheet
              // send discord webhook
              let _markIsVerifiedInSoldSheet = await markIsVerifiedInSoldSheet(doc, _fineScaleParseStockXVerificationArrivedList)

              let sendDiscordMe = await sendWebhookStockXVerified(_fineScaleParseStockXVerificationArrivedList, MY_WEBHOOK)
              if (!testmode){
                  let sendDiscordHermes = await sendWebhookStockXVerified(_fineScaleParseStockXVerificationArrivedList, HERMES_WEBHOOK)
              }
            }

            if (_fineParseStockXPayoutList?.length > 0) {
              // if order# match in sold sheet, update payout date
              // send discord webhook
              let _updatePayoutDateInSoldSheet = await updatePayoutDateInSoldSheet(doc, _fineParseStockXPayoutList)
              let sendDiscordMe = await sendWebhookStockXPayout(_fineParseStockXPayoutList, MY_WEBHOOK)
              if (!testmode){
                  let sendDiscordHermes = await sendWebhookStockXPayout(_fineParseStockXPayoutList, HERMES_WEBHOOK)
              }
            }

            if (aioParseList?.length > 0) {
              // if order# match in sold sheet, update is canceled to true
              // send discord webhook. no image on this one.
              let _updateCanceledInSoldSheet = await updateCanceledInSoldSheet(doc, aioParseList)
              let sendDiscordMe = await sendWebhookStockXCancelled(aioParseList, MY_WEBHOOK)
              if (!testmode) {
                  let sendDiscordHermes = await sendWebhookStockXCancelled(aioParseList, HERMES_WEBHOOK)
              }
            }
            // UPDATE SHEET end ------------------------------




            
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

  
 
