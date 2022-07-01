const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package


function cleanUpStyleId(string){
    console.log("🚀 ~ file: emailV2.js ~ line 62 ~ cleanUpStyleId ~ string", string)
      
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
    let unsoldGoat = doc.sheetsByTitle["Unsold SX"] //goat unsold tab - used only for GOAT, when shoe is stored - can be written into unsold tab.

    var currentTime = new Date()
    var year = currentTime.getFullYear()
    const moreRows = await unsoldGoat.addRows([
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
          "Delivery Date": formatDateMMDDYYY(`${ entireRow["Delivery Date"]} ${year}`), 
          "Delivery Confirmed": entireRow["Delivery Confirmed"],    
          "Platform": entireRow["Platform"]
      },
  
  ])  
  }

export default async (req, res) => {
   
    if (req.method === 'POST') {
        console.log(req.body)
        if (req.body.orderNumbers.length > 0) {

            // Google Doc Initiate Start --
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
            // Google Doc Initiate End --

            // Request Body Start --
            let successUpdates = []
            let orderNumbers = req.body.orderNumbers
            orderNumbers = [...new Set(orderNumbers)] //remove duplicates
            rows.forEach((row, index) => {
                if (orderNumbers.includes(row['Order Number'])) {
                    let num = orderNumbers[orderNumbers.indexOf(row['Order Number'])]
                    let entireRow = rows[index]
                    rows[index]['Delivery Confirmed'] = 'TRUE'
                    rows[index]['Calc Average']= `=HYPERLINK("https://stockx-email-scanner.vercel.app/average/${cleanUpStyleId(entireRow["Style ID"])}@${entireRow["Size"]}", "Calc Average")`,  

                    rows[index].save()
                    console.log(`${num} marked true in sheet`)
                    successUpdates.push(num)

                    // now update the unsold sx sheet
                    let varUpdateUnsoldSx = updateUnsoldSx(rows[index], doc)
                }
            })
            res.status(201).json({ success: true, data: successUpdates })

        } else {
            res.status(400).json({ success: false, data: "missing order numbers" })

        }
       
    }

}

