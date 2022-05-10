const Imap = require('imap');
const {simpleParser} = require('mailparser');
const imapConfig = {
  user: process.env.GMAIL_USER,
  password: process.env.PASSWORD,
  host: 'imap.gmail.com',
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

let finalStatus = 0

const getEmails = () => {
    try {
      const imap = new Imap(imapConfig, );
      console.log("logged in",process.env.GMAIL_USER, process.env.PASSWORD )
      imap.once('ready', () => {
        imap.openBox('INBOX', false, () => {
          imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
            const f = imap.fetch(results, {bodies: ''});
            f.on('message', msg => {
              msg.on('body', stream => {
                simpleParser(stream, async (err, parsed) => {
                  // const {from, subject, textAsHtml, text} = parsed;
                //   console.log(parsed.text);
                  let _largeScaleParse = largeScaleParse(parsed.text)
                  let _fineParse = fineParse(_largeScaleParse)
                  console.log("🚀 ~ file: email.js ~ line 68 ~ simpleParser ~ _finePArse", _fineParse)
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
        finalStatus = 1
      });
  
      imap.connect();
    } catch (ex) {
      console.log('an error occurred');
    }
  };

export default async (req, res) => {
   
    if (req.method === 'GET') {
        const emails = getEmails()
        
        if (finalStatus > 0) {
            return res.status(200).json({ data: "ok" })
        }
               
          
        } 
    }

    
   



