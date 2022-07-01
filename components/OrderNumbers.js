
import { CheckCircleIcon } from '@heroicons/react/solid'
import {useState, useEffect} from 'react'

export default function OrderNumbers({orderNumbers, setOrderNumbers, clearInput}) {
  const [input, setInput] = useState()
  useEffect(() => {
    if (clearInput) {
      setInput('')
    }
  }, [clearInput])
  
  return (
    <div className='z-0'>
      
      <div className="mt-1 relative rounded-md py-1">
        <input
           onChange={(e) => {
             setInput(e.target.value)
               if (e.target.value.replaceAll("-","").length == 16){
                setOrderNumbers([...orderNumbers, e.target.value])
               }
            }}
          type="text"
          value={input}
          name="account-number"
          id="account-number"
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-md border-gray-300 rounded-md"
          placeholder="00000000-00000000"
        />
        {
          input?.replaceAll("-","")?.length == 16 &&
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
        </div>
        }
       
      </div>
    </div>
  )
}
