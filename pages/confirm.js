import React from 'react'
import OrderNumbers from '../components/OrderNumbers'
import NotificationBox from '../components/NotificationBox'
import {useState} from 'react'

function confirm() {
    const [orderNumbers, setOrderNumbers] = useState([])
    const [loading, setLoading] = useState(false)
    const [clearInput, setClearInput] = useState(false)
    const [show, setShow] = useState(false)
    const [res, setRes] = useState()



  async function markDelivered(orderNumbers) {
    setLoading(true)
    const res = await fetch ("/api/confirmDelivery", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({orderNumbers:orderNumbers}) 
    })
    const {data} = await res.json() 
    setLoading(false)
    setClearInput(true)
    setShow(true)
    setRes(data)
    setOrderNumbers([])
    return data //success, data
  }

    
  return (
    <>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">

                    <div className='z-50 absolute'>
                        <NotificationBox show={show} setShow={setShow} res={res}/>
                    </div>

                    <div className='pt-4'>
                        <label htmlFor="account-number" className="block text-lg font-medium text-gray-700">
                            Input Order Numbers
                        </label>
                        <OrderNumbers orderNumbers={orderNumbers} setOrderNumbers={setOrderNumbers} clearInput={clearInput}/>
                        <OrderNumbers orderNumbers={orderNumbers} setOrderNumbers={setOrderNumbers} clearInput={clearInput}/>
                        <OrderNumbers orderNumbers={orderNumbers} setOrderNumbers={setOrderNumbers} clearInput={clearInput}/>
                        <OrderNumbers orderNumbers={orderNumbers} setOrderNumbers={setOrderNumbers} clearInput={clearInput}/>
                       
                       
                    </div>

                    <div className='py-2'>
                    <button
                            onClick={async () => {
                                if (orderNumbers.length > 0){
                                    let res = await markDelivered(orderNumbers) //success, data
                                }}}
                                
                            type="button"
                            className="w-full sm:max-w-xs inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                           <span className='mx-auto'>{loading ? 
                                              <svg className="animate-spin mx-auto h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="purple" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            :
                                            "Confirm Delivery"   
                        }</span>
                        </button>
                    </div>
                  
                </div>
            </div>
        
          </>
  )
}

export default confirm