function formatDateMMDDYYY(_date){ //2010-10-11T00:00:00+05:30
    let date = new Date(_date)
    let returnDate =  (((date.getMonth() > 8) ? (date.getMonth() + 1) : ('' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('' + date.getDate())) + '/' + date.getFullYear())
    console.log("🚀 ~ file: emailV2.js ~ line 114 ~ formatDateMMDDYYY ~ returnDate", returnDate)
    return returnDate
  }

  export function formatDate(fineParseStockXString){
    let edit1 = fineParseStockXString.split(" at ")
    return edit1[0]
  }


export async function largeScaleParseAliasCompleted(subject, emailDate){
    //Subject: Order #778237063 Completed: $156.99 Available for Cash Out
    const splitByLine = subject.split(" ")
    let rawDetails = {}
    splitByLine.forEach(line => {
        if (line.includes("#")){
            rawDetails["orderNumber"] = line.replaceAll("#", "")
        }
    })
    rawDetails["date"] = formatDateMMDDYYY (formatDate(emailDate.toString()))
    rawDetails["isCompleted"] = "TRUE"
    return rawDetails
}

export async function markIsCompletedInSoldSheet(doc, _fineParseAliasComplete){
    await doc.loadInfo();
    let soldSheet = doc.sheetsByTitle["Sold"]
    const rows = await soldSheet.getRows()

    let justOrderNums = []
    _fineParseAliasComplete?.forEach(item => {
        justOrderNums.push(item["orderNumber"])
    })

    rows.forEach(async (row, index) => {
        if (justOrderNums?.includes(row["Order Number"])){
            console.log("found a match for alias complete ")
            let indexNumber = justOrderNums?.indexOf(row["Order Number"])
            let fullItem = _fineParseAliasComplete[indexNumber]
            rows[index]["Date Completed"] = fullItem.date
            rows[index]["Is Completed"] = "TRUE"
            rows[index]["Calc Average"] = rows[index]["Calc Average"].formula
            rows[index].save()
        }

    })
}

export async function sendWebhookAliasCompleted(_fineParseArray, webhookUrl) { 
    console.log("🚀 ~ file: AliasCompleted.js ~ line 226 ~ sendWebhookAliasCompleted ~ _fineParseArray", _fineParseArray)
    
    
        function hexToDecimal(hex) {
            return parseInt(hex.replace("#",""), 16)
        }
    
        let allEmbeds = []
        _fineParseArray.forEach(_fineParse => {
            var myEmbed = {
                author: {
                  name: "New Alias Email Detected",
                },
                // thumbnail: { url:  _fineParse.image},
                title: _fineParse.title,
                description: 
                    `Order: #####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 4)}\nEmail Type: Alias Completed`,
                   
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
