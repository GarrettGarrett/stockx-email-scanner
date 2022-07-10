import { discordArrayConfirmDelivery } from '../../utils/DiscordArrayConfirmDelivery'
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package


async function getImageSx(styleId){
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

async function iterateRows(rows, orderNumbers, successUpdates, doc, completeRows) {
    rows.forEach(async (row, index) => {
    // for (var row of rows) {
        if (orderNumbers.includes(row['Order Number'])) {
            let num = orderNumbers[orderNumbers.indexOf(row['Order Number'])]
            let entireRow = rows[index]
            rows[index]['Delivery Confirmed'] = 'TRUE'
            rows[index]['Calc Average']= `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(entireRow["Style ID"])}@${entireRow["Size"]}", "Calc Average")`

            rows[index].save()
            rows.save
            console.log(`${num} marked true in sheet`)
            successUpdates.push(num)
            completeRows.push(rows[index])

            // // now update the Unsold In House sheet
            // updateUnsoldSx(rows[index], doc)
        }
    })
    return "done"
}


function cleanUpStyleId(string){
    // console.log("🚀 ~ file: emailV2.js ~ line 62 ~ cleanUpStyleId ~ string", string)
      
      let parse1 = string.replaceAll("-", "")
      let parse2 = parse1.trim()
      let parse3 = parse2.replaceAll("/","")
      let parse4 = parse3.replaceAll(" ", "")
      return parse4
    }

function formatDateMMDDYYY(_date){ //2010-10-11T00:00:00+05:30
    let date = new Date(_date)
    let returnDate =  (((date.getMonth() > 8) ? (date.getMonth() + 1) : ('' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('' + date.getDate())) + '/' + date.getFullYear())
    console.log("🚀 ~ file: emailV2.js ~ line 114 ~ formatDateMMDDYYY ~ returnDate", returnDate)
    return returnDate
  }


async function updateUnsoldSx(entireRow, doc){
    let unsoldInHouse = doc.sheetsByTitle["Unsold In House"] //goat unsold tab - used only for GOAT, when shoe is stored - can be written into unsold tab.

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    const moreRows = await unsoldInHouse.addRows([
      { 
          "Style ID": entireRow["Style ID"], 
          "Size": entireRow["Size"], 
          "Title": entireRow["Title"], 
          "Condition": entireRow["Condition"], 
          "Calc Average": `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(entireRow["Style ID"])}@${entireRow["Size"]}", "Calc Average")`, 
          "Order Number": entireRow["Order Number"], 
          "Purchase Price": entireRow["Purchase Price"], 
          "Processing Fee": entireRow["Processing Fee"], 
          "Shipping": entireRow["Shipping"], 
          "Total Payment": entireRow["Total Payment"], 
          "hasConfirmedEmail": entireRow["hasConfirmedEmail"], 
          "hasDeliveredEmail": entireRow["hasDeliveredEmail"], 
          "Is Cancelled": entireRow["Is Cancelled"], 
          "Purchase Date": entireRow["Purchase Date"], 
          "Delivery Date": entireRow["Delivery Date"], 
          "Delivery Confirmed": entireRow["Delivery Confirmed"],    
          "Platform": entireRow["Platform"]
      },
  
  ])  
  await new Promise(r => setTimeout(r, 1000));
  if (moreRows){
      console.log("🚀 ~ file: confirmDelivery.js ~ line 72 ~ updateUnsoldSx ~ moreRows", moreRows)
      return moreRows
  }
  }

export default async (req, res) => {
   
    if (req.method === 'POST') {
        if (req.body.orderNumbers.length > 0) {
            // Google Doc Initiate Start --------------------------------
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
            await doc.loadInfo();
            let importerStockX = doc.sheetsByTitle["Importer - SX"]; //stockx importer tab
            const rows = await importerStockX.getRows()
            // Google Doc Initiate End ---------------------------

            // Request Body Start ----------------------------------------------
            let successUpdates = []
            let orderNumbers = req.body.orderNumbers
            let completeRows = []
            let formatedCompleteRows = []
            let discordFormatArray = []
            let iterate = await iterateRows(rows, orderNumbers, successUpdates, doc, completeRows)
            console.log("🚀 ~ file: confirmDelivery.js ~ line 98 ~ iterate", iterate)

            // if (iterate){
            //     res.status(201).json({ success: true, data: successUpdates })
            // }
            completeRows.forEach(async completeRow => {
                formatedCompleteRows.push({ 
                    "Style ID": completeRow["Style ID"], 
                    "Size": completeRow["Size"], 
                    "Title": completeRow["Title"], 
                    "Condition": completeRow["Condition"], 
                    "Calc Average": `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(completeRow["Style ID"])}@${completeRow["Size"]}", "Calc Average")`, 
                    "Order Number": completeRow["Order Number"], 
                    "Purchase Price": completeRow["Purchase Price"], 
                    "Processing Fee": completeRow["Processing Fee"], 
                    "Shipping": completeRow["Shipping"], 
                    "Total Payment": completeRow["Total Payment"], 
                    "hasConfirmedEmail": completeRow["hasConfirmedEmail"], 
                    "hasDeliveredEmail": completeRow["hasDeliveredEmail"], 
                    "Is Cancelled": completeRow["Is Cancelled"], 
                    "Purchase Date": completeRow["Purchase Date"], 
                    "Delivery Date": completeRow["Delivery Date"], 
                    "Delivery Confirmed": completeRow["Delivery Confirmed"],    
                    "Platform": completeRow["Platform"]
                })
                discordFormatArray.push({
                    "Title": completeRow["Title"],
                    "Style ID": completeRow["Style ID"], 
                    "Order Number": completeRow["Order Number"], 
                    "Image": await getImageSx(completeRow["Style ID"])
                })
            })
            

            let unsoldInHouse = doc.sheetsByTitle["Unsold In House"] //goat unsold tab - used only for GOAT, when shoe is stored - can be written into unsold tab.
            var currentTime = new Date()
            var year = currentTime.getFullYear()
            console.log("🚀 ~ file: confirmDelivery.js ~ line 139 ~ formatedCompleteRows", formatedCompleteRows)
            const moreRows = await unsoldInHouse.addRows(formatedCompleteRows)
            unsoldInHouse.saveCells

            let sendDiscordMe = await discordArrayConfirmDelivery(discordFormatArray, '975581477121175592/hyEOkvLhyb5HUBbH_XiPXnNi7jL8ybCxuVRXpfie6UVlcAp4bmEsCp7wGNDpRrkJ5-1C')
            let sendDiscordHermes = await discordArrayConfirmDelivery(discordFormatArray, "975584745754878042/nHrt5qw_bY4qlD0KPm8r6g3-3TkDP74f3fNcP0PZTYcjRpuAzR2vJDseaUPTQDbSGcB2")


            await new Promise(r => setTimeout(r, 4000));
            res.status(200).json({ success: true, data: successUpdates })

           

        } else {
            res.status(400).json({ success: false, data: "missing order numbers" })

        }
       
    }

}

