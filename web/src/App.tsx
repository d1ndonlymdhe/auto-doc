import { useState } from 'react'
import './App.css'
import { ObjectField } from './formRenderer'
import { BoolRepr, NumberRepr, ObjectRepr, StringRepr } from './reflection'

function App() {
  const [val, setVal] = useState({})


  return <div>
    <ObjectField
      name="root"
      value={val}
      setValue={setVal}
      repr={ObjectRepr({
        name: StringRepr(),
        age: NumberRepr(),
        isAdmin: BoolRepr(),
        data: ObjectRepr(
          {
            class: StringRepr()
          }
        )
      })}
    ></ObjectField>
  </div>
}

export default App
