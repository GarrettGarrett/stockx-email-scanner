const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs') // File handling package

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


function oneMonthsAgo(){
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d
}

export default async (req, res) => {
   
    if (req.method === 'GET') {
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
                              console.log("found a stockX email...")

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
              console.log(ex);
            }
          };

          const emails = await getEmails()
          return res.status(200).json({ data: "ok" })
    }
   

}
