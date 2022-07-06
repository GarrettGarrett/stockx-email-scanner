function formatDate(fineParseStockXString){
    let edit1 = fineParseStockXString.split(" at ")
    return edit1[0]
  }



function formatDateMMDDYYY(_date){ //2010-10-11T00:00:00+05:30
    let date = new Date(_date)
    let returnDate =  (((date.getMonth() > 8) ? (date.getMonth() + 1) : ('' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('' + date.getDate())) + '/' + date.getFullYear())
    console.log("🚀 ~ file: emailV2.js ~ line 114 ~ formatDateMMDDYYY ~ returnDate", returnDate)
    return returnDate
  }

function cleanUpStyleId(string){
    // console.log("🚀 ~ file: emailV2.js ~ line 62 ~ cleanUpStyleId ~ string", string)
      
      let parse1 = string.replaceAll("-", "")
      let parse2 = parse1.trim()
      let parse3 = parse2.replaceAll("/","")
      let parse4 = parse3.replaceAll(" ", "")
      return parse4
    }

export async function getImageSx(styleId){
    var myHeaders = new Headers();
    myHeaders.append("authority", "stockx.com");
    myHeaders.append("accept", "application/json");
    myHeaders.append("accept-language", "en-US,en;q=0.9");
    myHeaders.append("app-platform", "Iron");
    myHeaders.append("app-version", "2022.06.19.01");
    myHeaders.append("if-none-match", "W/\"c98-aYU7yA79Azi9ian5PKR9LFOOAPA\"");
    // myHeaders.append("referer", "https://stockx.com/nike-dunk-low-retro-white-black-2021");
    myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"");
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", "\"macOS\"");
    myHeaders.append("sec-fetch-dest", "empty");
    myHeaders.append("sec-fetch-mode", "cors");
    myHeaders.append("sec-fetch-site", "same-origin");
    myHeaders.append("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36");
    myHeaders.append("x-requested-with", "XMLHttpRequest");
    // myHeaders.append("Cookie", "__cf_bm=XpgC2a1N3C.ppDniyGhU833whuDQtyF5RuRSLOex4Mg-1656287717-0-AYRZ6dkTP88h2EzUNcld1o5du54C5Q8leo99iclgH2XM3+8nN9zIXYmQMM0TQSB/sNgi0ir+pVsv4AeoYv9RKRM=");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    let res = await fetch(`https://stockx.com/api/browse?_search=${styleId}&page=1&resultsPerPage=10&dataType=product`, requestOptions)
    const {Products} = await res.json()
    const firstThumb  = Products[0].media.thumbUrl
    console.log("🚀 ~ file: [id].js ~ line 31 ~ getImageFromSx ~ firstThumb", firstThumb)
    return firstThumb
}

export function fineParseStockXSoldItem2(rawDetails, subject) { // only continue if confirmation or delivery or refund email:
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
      fineDetails["condition"] = rawDetails['condition']?.substring(rawDetails.condition.indexOf(":") + 2, rawDetails.condition.length)  
      fineDetails["orderNumber"] = rawDetails['orderNumber']?.substring(rawDetails.orderNumber.indexOf(":") + 2, rawDetails.orderNumber.length)  
      fineDetails["salePrice"] = rawDetails['salePrice']?.substring(rawDetails.salePrice.indexOf(": ") + 2, rawDetails.salePrice.length)  
      fineDetails["transactionFee"] = rawDetails['transactionFee']?.substring(rawDetails.transactionFee.indexOf(": ") + 2, rawDetails.transactionFee.length)  
      fineDetails["paymentProc"] = rawDetails['paymentProc']?.substring(rawDetails.paymentProc.indexOf(": ") + 2, rawDetails.paymentProc.length)  
      fineDetails["shipping"] = rawDetails['shipping']?.substring(rawDetails.shipping.indexOf(": ") + 2, rawDetails.shipping.length)  
      fineDetails["totalPayout"] = rawDetails['totalPayout']?.substring(rawDetails.totalPayout?.indexOf("$") + 0, rawDetails.totalPayout.length - 1)
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
  
export function largeScaleParseStockXVerification(_string, subject, date){
    const splitByLine = _string.split(/\r?\n/)
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
        
        if (line.includes("Ready For Authentication")){
            rawDetails["title"] = splitByLine[index + 1]
        }
      
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

export function largeScaleParseStockXSold(_string, subject, date){
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

    function cleanUpSize(string){
        function hasNumber(myString) {
          return /\d/.test(myString);
        }
        function removeAlpha(string){
          string = string.replace(/\D/g,'')
          return string
        }
      
        let split = string.split(" ")
        
        let res 
        let resultFound = false
      
        split.forEach(item => {
          if (hasNumber(item) && !resultFound) {
            res = removeAlpha(item)
            resultFound = true
          }
        })
        return res
      }

    export async function lookForMatchStockXSold(doc, _fineParseStockXSoldList){
        await doc.loadInfo();
        let unsoldStockX = doc.sheetsByTitle["Unsold SX"]
        let soldSheet = doc.sheetsByTitle["Sold"]
        const rows = await unsoldStockX.getRows()
        const rowsSold = await soldSheet.getRows()
    
        let _fineParseStockXSoldList_CLEAN_styleId_Size = [] // styleid+size, styleid+size, etc.
        _fineParseStockXSoldList.forEach(item => {
            let _cleanStyleId = cleanUpStyleId(item['styleID'])
            let _cleanSize = cleanUpSize(item['size'])
            _fineParseStockXSoldList_CLEAN_styleId_Size.push(_cleanStyleId+_cleanSize)
        })
        let wereThereAnyMatches = false
        let rowsToAddToSales= []
        let rowsToAddunsoldStockX = []
    
        rows.forEach(async (row, index) => {
            let cleanStyleIdSheet = cleanUpStyleId(row['Style ID'])
            let cleanSizeSheet = cleanUpSize(row['Size'])
            if (_fineParseStockXSoldList_CLEAN_styleId_Size?.includes(cleanStyleIdSheet+cleanSizeSheet)){
                console.log("StockX Sold Email StyleId + Size matches Unsold Consigned entry at row: ", index)
                let indexItem = _fineParseStockXSoldList_CLEAN_styleId_Size?.indexOf(cleanStyleIdSheet+cleanSizeSheet)
                let fullItem = _fineParseStockXSoldList[indexItem]
                let entireRow = rows[index]
                entireRow["Is Sold"] = "TRUE"
                entireRow["Sale Price"] = fullItem.salePrice
                entireRow["Sale Transaction Fee"] = fullItem.transactionFee
                entireRow["Sale Payment Processing Fee"] = fullItem.paymentProc
                entireRow["Sale Shipping"] = fullItem.shipping
                entireRow["Sale Total Payout"] = fullItem.totalPayout
                entireRow["Date Sold"] = fullItem.date
                entireRow['Calc Average']= `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(fullItem["styleID"])}@${fullItem["size"]}", "Calc Average")`
                rows[index].save()
                console.log("StockX Item Marked Sold")
                wereThereAnyMatches = true
    
                // add to sales sheet using details from this row in unsold sheet. instead of adding a single row here, bulk add rows at the end but for now add this row to a list.
                rowsToAddToSales.push(entireRow)
                
            }
        })
    
        if (!wereThereAnyMatches){
            // add to sales sheet using email details
            // create a row object for each item in fineparse
            _fineParseStockXSoldList.forEach(item => {
                rowsToAddunsoldStockX.push(
                    { 
                        "Style ID": item.styleID, 
                        "Size": item.size, 
                        "Title": item.title, 
                        "Condition": item.condition, 
                        "Order Number": item.orderNumber, 
                        // "Sub Total": item.subTotal, 
                        // "Shipping": item.shipping, 
                        // "Goat Credit": item.goatCredit, 
                        "Total Paid": item.totalPaid, 
                        // "hasConfirmedEmail": item.hasConfirmedEmail, 
                        // "hasStorageEmail": item.hasStorageEmail, 
                        // "Delivery Date": item.date,
                        // "Delivery Confirmed": item.hasStorageEmail,
                        // "Platform": item.website,
                        "Calc Average": `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(item["styleID"])}@${item["size"]}", "Calc Average")`,
                        "Date Sold": item.date,
                        // "Amount Received": ((Number(item.amountMade)) * .971).toFixed(2),
                        "Sale Price": item.salePrice,
                        "Sale Transaction Fee": item.transactionFee,
                        "Sale Payment Processing Fee": item.paymentProc,
                        "Sale Shipping": item.shipping,
                        "Sale Total Payout": item.totalPayout,
                        "Is Sold": "TRUE"
                    })
            })
            const bulkRowsConsigned = await soldSheet.addRows(rowsToAddunsoldStockX)
            console.log("No Matches, so this item was added to sold sheet")
        }
        if (wereThereAnyMatches) {
            const bulkRows = await soldSheet.addRows(rowsToAddToSales)
            console.log("Match found, sold entry added based on values in unsold SX")
        }
    }

    export async function sendWebhookStockXSold(_fineParseArray, webhookUrl) { 
       
        
            function hexToDecimal(hex) {
                return parseInt(hex.replace("#",""), 16)
            }
        
            let allEmbeds = []
            _fineParseArray.forEach(_fineParse => {
                var myEmbed = {
                    author: {
                      name: "New StockX Sold Email Detected",
                    },
                    thumbnail: { url:  _fineParse.image},
                    title: _fineParse.title,
                    description: 
                        `Style ID: ${_fineParse.styleID}\nOrder: ########-####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 5)}\nSale Price: ${_fineParse.salePrice}\nTotal Payout: ${_fineParse.totalPayout}\nEmail Type: ✅ You Sold Your Item`,
                       
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

export function fineParseStockXVerification(rawDetails, subject) { // only continue if confirmation or delivery or refund email:
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
    fineDetails["title"] = rawDetails.title
    fineDetails['subject'] = rawDetails.subject
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


    export async function markIsVerifiedInSoldSheet(doc, _fineParseAliasComplete){
        await doc.loadInfo();
        let soldSheet = doc.sheetsByTitle["Sold"]
        const rows = await soldSheet.getRows()
    
        let justOrderNums = []
        _fineParseAliasComplete?.forEach(item => {
            justOrderNums.push(item["orderNumber"])
        })
    
        rows.forEach(async (row, index) => {
            if (justOrderNums?.includes(row["Order Number"])){
                console.log("found a match for sx verified")
                let indexNumber = justOrderNums?.indexOf(row["Order Number"])
                let fullItem = _fineParseAliasComplete[indexNumber]
                rows[index]["Date Verified"] = fullItem.date
                rows[index]["Arrived For Verification"] = "TRUE"
                rows[index]["Calc Average"] = rows[index]["Calc Average"].formula
                rows[index].save()
            }
    
        })
    }


    export async function sendWebhookStockXVerified(_fineParseArray, webhookUrl) { 
       
        
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
                    `Style ID: ${_fineParse.styleID}\nOrder: ########-####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 5)}\nSale Price: ${_fineParse.salePrice}\nTotal Payout: ${_fineParse.totalPayout}\nEmail Type: Item Arrived For Verification`,
                   
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

export async function updatePayoutDateInSoldSheet(doc, _fineParseAliasComplete){
    await doc.loadInfo();
    let soldSheet = doc.sheetsByTitle["Sold"]
    const rows = await soldSheet.getRows()

    let justOrderNums = []
    _fineParseAliasComplete?.forEach(item => {
        justOrderNums.push(item["orderNumber"])
    })

    rows.forEach(async (row, index) => {
        if (justOrderNums?.includes(row["Order Number"])){
            console.log("found a match for StockX Payout ")
            let indexNumber = justOrderNums?.indexOf(row["Order Number"])
            let fullItem = _fineParseAliasComplete[indexNumber]
            rows[index]["Date SX Payout Sent"] = fullItem.date
            rows[index]["Calc Average"] = rows[index]["Calc Average"].formula
            rows[index].save()
        }

    })
}




export async function sendWebhookStockXPayout(_fineParseArray, webhookUrl) { 
        
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



export function aioParseStockXCancelledSale(bodyText, subject, date){
    let rawDetails = {}
    const splitByLine = bodyText.split(/\r?\n/)

    splitByLine.forEach(line => {
        if (line.includes("Order #")){
            let orderNumber = line.substring(line.indexOf(":") + 2, line.length)
            rawDetails['orderNumber'] = orderNumber
            let rawDate = date.toString()
            rawDetails['date'] = formatDateMMDDYYY( formatDate(rawDate.substring(rawDate.indexOf(": ") + 2, rawDate.length )  ) )
            rawDetails['title'] = subject.substring(subject.indexOf("Canceled:") + 10, subject.length)
        }
    })
    return rawDetails
    
}