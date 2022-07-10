

function cleanUpStyleId(string){
    // console.log("🚀 ~ file: emailV2.js ~ line 62 ~ cleanUpStyleId ~ string", string)
      
      let parse1 = string.replaceAll("-", "")
      let parse2 = parse1.trim()
      let parse3 = parse2.replaceAll("/","")
      let parse4 = parse3.replaceAll(" ", "")
      return parse4
    }

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




export  function fineParseAliasNonConsigned(rawDetails) {
    if (
        rawDetails?.subject?.includes("Sold")
        
    ) {
        let fineDetails = {}
        try {
        fineDetails["styleID"] = rawDetails['styleID'].substring(rawDetails.styleID.indexOf(":") + 2, rawDetails.styleID.length)  
        } catch {
        fineDetails["styleID"] = "None"//shoes have style id, but basketball for example wont.
        }
        fineDetails.website = "Alias"
        try {
        fineDetails["size"] = rawDetails['size'].substring(rawDetails.size.indexOf(":") + 2, rawDetails.size.length)  
        } catch {
        fineDetails["size"] = "None" 
    
        }
        fineDetails["title"] = rawDetails['title'].substring(rawDetails.title.indexOf(":") + 2, rawDetails.title.length)  
        fineDetails["condition"] = rawDetails['condition'].substring(rawDetails.condition.indexOf(":") + 2, rawDetails.condition.length)  
        fineDetails["orderNumber"] = rawDetails['orderNumber'].substring(rawDetails.orderNumber.indexOf(":") + 2, rawDetails.orderNumber.length)  
    //   fineDetails["purchasePrice"] = rawDetails['purchasePrice'].substring(rawDetails.purchasePrice.indexOf(": ") + 2, rawDetails.purchasePrice.length)  
    //   fineDetails["processingFee"] = rawDetails['processingFee'].substring(rawDetails.processingFee.indexOf(": ") + 2, rawDetails.processingFee.length)  
    //   fineDetails["shipping"] = rawDetails['shipping'].substring(rawDetails.shipping.indexOf(": ") + 2, rawDetails.shipping.length)  
        fineDetails["totalPayment"] = rawDetails['totalPayment'].substring(rawDetails.totalPayment.indexOf("$") + 0, rawDetails.totalPayment.length - 0)
        fineDetails["amountMade"] = (Number(rawDetails['amountMade'].substring(rawDetails.amountMade.indexOf("$") + 1, rawDetails.amountMade.length - 0)) * .971).toFixed(2) //requested by customer
    //   fineDetails["Calc Average"] = `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(fineDetails["styleID"])}@${fineDetails["size"]}", "Calc Average")`
    
        
        if (rawDetails.dateRetrievedFromStamp){
        fineDetails["date"] = formatDateMMDDYYY (formatDate(rawDetails.date) )
        } else { //retrieved date from body 
        fineDetails["date"] = formatDateMMDDYYY( formatDate(rawDetails['date'].substring(rawDetails.date.indexOf(": ") + 2, rawDetails.date.length )  ) )
        }
        
    //   if (rawDetails.subject.includes("Confirmed")){
    //       fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Confirmed:") + 11, rawDetails.subject.length)  
    //       fineDetails['hasConfirmedEmail'] = true
    //   }
    //   if (rawDetails.subject.includes("Delivered")){
    //       fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Delivered:") + 11, rawDetails.subject.length)  
    //       fineDetails['hasDeliveredEmail'] = true
    //       fineDetails['hasConfirmedEmail'] = true
    //   }
    //   if (rawDetails.subject.includes("Refund")){
    //     fineDetails["title"] = rawDetails['subject'].substring(rawDetails.subject.indexOf("Refund Issued:") + 15, rawDetails.subject.length)  
    //     fineDetails['isRefund'] = true
    // }
        return fineDetails
    }
}


export async function lookForMatchAliasNonConsigned(doc, _fineParseAliasConsignedList){
    await doc.loadInfo();
    let unsoldConsigned = doc.sheetsByTitle["Unsold In House"]
    let soldSheet = doc.sheetsByTitle["Sold"]
    const rows = await unsoldConsigned.getRows()
    const rowsSold = await soldSheet.getRows()

    let _fineParseAliasNonConsignedList_CLEAN_styleId_Size = [] // styleid+size, styleid+size, etc.
    _fineParseAliasConsignedList.forEach(item => {
        let _cleanStyleId = cleanUpStyleId(item['styleID'])
        let _cleanSize = cleanUpSize(item['size'])
        _fineParseAliasNonConsignedList_CLEAN_styleId_Size.push(_cleanStyleId+_cleanSize)
    })
    let wereThereAnyMatches = false
    let rowsToAddToSales= []
    let rowsToAddUnsoldConsigned = []

    rows.forEach(async (row, index) => {
        let cleanStyleIdSheet = cleanUpStyleId(row['Style ID'])
        let cleanSizeSheet = cleanUpSize(row['Size'])
        if (_fineParseAliasNonConsignedList_CLEAN_styleId_Size?.includes(cleanStyleIdSheet+cleanSizeSheet)){
            console.log("Alias Non Consigned Email StyleId + Size matches Unsold In House entry at row: ", index)
            let indexItem = _fineParseAliasNonConsignedList_CLEAN_styleId_Size?.indexOf(cleanStyleIdSheet+cleanSizeSheet)
            let fullItem = _fineParseAliasConsignedList[indexItem]
            let entireRow = rows[index]
            entireRow["Is Sold"] = "TRUE"
            entireRow["Amount Received"] = fullItem.amountMade
            entireRow["Date Sold"] = fullItem.date
            entireRow['Calc Average']= `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(fullItem["styleID"])}@${fullItem["size"]}", "Calc Average")`
            rows[index].save()
            console.log("Unsold Consigned Item Marked Sold")
            wereThereAnyMatches = true

            // add to sales sheet using details from this row in unsold sheet. instead of adding a single row here, bulk add rows at the end but for now add this row to a list.
            rowsToAddToSales.push(entireRow)
            
        }
    })

    if (!wereThereAnyMatches){
        // add to sales sheet using email details
        // create a row object for each item in fineparse
        _fineParseAliasConsignedList.forEach(item => {
            rowsToAddUnsoldConsigned.push(
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
                    "Date Sold": item.date,
                    "Is Sold": "TRUE",
                    "Calc Average": `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(item["styleID"])}@${item["size"]}", "Calc Average")`,
                    "Amount Received": item.amountMade,
                  }
            )
        })
        const bulkRowsConsigned = await soldSheet.addRows(rowsToAddUnsoldConsigned)
        console.log("No Matches, so this item was added to sold sheet")
    }
    if (wereThereAnyMatches) {
        const bulkRows = await soldSheet.addRows(rowsToAddToSales)
        console.log("Match found, sold entry added based on values in unsold consigned")
    }

    
}

export async function sendWebhookAliasNonConsigned(_fineParseArray, webhookUrl) { 
    console.log("🚀 ~ file: AliasConsigned.js ~ line 226 ~ sendWebhookAliasConsigned ~ _fineParseArray", _fineParseArray)
    
    
        function hexToDecimal(hex) {
            return parseInt(hex.replace("#",""), 16)
        }
    
        let allEmbeds = []
        _fineParseArray.forEach(_fineParse => {
            var myEmbed = {
                author: {
                  name: "New Alias Email Detected",
                },
                thumbnail: { url:  _fineParse.image},
                title: _fineParse.title,
                description: 
                    `Style ID: ${_fineParse.styleID}\nOrder: #####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 4)}\nAmount Made (-2.9%): $${(Number(_fineParse.amountMade)* .971).toFixed(2)}\nEmail Type: Alias Sold`,
                   
                color: hexToDecimal("#5C65ED"),
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
            username: "Alias Importer",
            embeds: allEmbeds,
            avatar_url: "https://i.imgur.com/EnGFpod.png",
        })
        
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };
    
        var messageDiscord =  await fetch("https://discord.com/api/webhooks/" + webhookUrl, requestOptions)
    
        console.log("🚀 ~ file: AliasConsigned.js ~ line 282 ~ sendWebhookAliasConsigned ~ messageDiscord.status", messageDiscord.status)
    
        return messageDiscord.status
    }
    
    
    