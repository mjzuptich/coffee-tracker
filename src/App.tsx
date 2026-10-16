import { useEffect, useState } from 'react'
import type { Coffee } from './data/coffee'
import InventoryForm from './InventoryForm'
import './App.scss'
import bonesLogo from './img/bones-logo.jpg'

function App() {
  const [inventory, setInventory] = useState<Coffee[]>([])
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/coffees')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load inventory')
        }
        return response.json() as Promise<Coffee[]>
      })
      .then(setInventory)
      .catch(() => setError('Could not connect to the server.'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleAddCoffee = async (coffee: Coffee) => {
    const response = await fetch('/api/coffees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coffee),
    });

    if (!response.ok) {
      throw new Error('Could not save to inventory');
    }

    const savedCoffee = await response.json() as Coffee;

    setInventory((currentInventory) => [
      ...currentInventory,
      savedCoffee,
    ])
  }

  const handleUpdateCoffee = async (coffee: Coffee) => {
    const response = await fetch(`/api/coffees/${coffee.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(coffee),
    })

    if (!response.ok) {
      const message = await response.text()
      console.error(response.status, message)
      throw new Error('Could not update inventory')
    }

    const savedCoffee = await response.json() as Coffee

    setInventory((currentInventory) =>
      currentInventory.map((item) =>
        item.id === savedCoffee.id ? savedCoffee : item
      )
    )

    setEditingCoffee(null)
  }

  const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);

  const visibleInventory = inventory.filter((coffee) =>
    selectedFlavors.every((selectedFlavor) =>
      coffee.flavorKeywords.some(
        (flavor) => flavor.trim().toLowerCase() === selectedFlavor
      )
    )
  );

  const allFlavors = [
    ...new Set(
      inventory
        .flatMap((coffee) => coffee.flavorKeywords)
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0)
    ),
  ].sort();

  const availableFlavors = [
    ...new Set(
      visibleInventory
        .flatMap((coffee) => coffee.flavorKeywords)
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0)
    ),
  ].sort();

  return (
    <div className="coffee__wrapper">
      <InventoryForm
        key={editingCoffee?.id ?? 'new'}
        coffeeToEdit={editingCoffee}
        onAdd={handleAddCoffee}
        onUpdate={handleUpdateCoffee}
        onCancel={() => setEditingCoffee(null)}
        availableFlavors={allFlavors}
      />
      {isLoading && <p>Loading inventory...</p>}
      {error && <p>{error}</p>}
      <h2 className="coffee-inventory__title">Inventory</h2>
      <select
        aria-label="Flavor Filter"
        value={selectedFlavors.at(-1) ?? '__all__'}
        onChange={(event) => {
          const flavor = event.target.value;

          if (flavor === '__all__') {
            setSelectedFlavors([]);
          } else if (flavor) {
            setSelectedFlavors((current) => [...current, flavor]);
          }
        }}
      >
        <option value="__all__">Show All</option>

        {selectedFlavors.length > 0 && (
          <option value={selectedFlavors.at(-1)!} disabled>
            {selectedFlavors.join(' + ')}
          </option>
        )}

        {availableFlavors.map((flavor) => (
          <option key={flavor} value={flavor}>
            {flavor}
          </option>
        ))}
      </select>
      {inventory.length === 0 && !isLoading && <p>No inventory available.</p>}
      {error && <p>{error}</p>}
      {isLoading && <p>Loading inventory...</p>}
      <ul className="coffee-inventory__list">
        {visibleInventory.filter((coffee) => coffee.quantity > 0).map((coffee) => (
          <li className={`coffee-inventory__card ${coffee.isBones ? 'bones-coffee' : ''}`} key={coffee.id}>
            <h3 className="coffee-inventory__heading"><span className="coffee-inventory__name">{coffee.name}</span><span className="coffee-inventory__quantity">Qty: {coffee.quantity}</span></h3>
            <p className="coffee-inventory__description">{coffee.flavorDescription}</p>
            <p className="coffee-inventory__keyword-list">
              {coffee.flavorKeywords.map((term) => (
                <span className="coffee-inventory__keyword" key={term}>
                  {term}
                </span>
              ))}
            </p>
            <p className="coffee-inventory__checkbox-item">
              Open Bag: {coffee.isOpen ? '⛔' : '✅'}
            </p>
            <p className="coffee-inventory__checkbox-item">
              Low Qty Bag: {coffee.isLow ? '⛔' : '✅'}</p>
              <button
                type="button"
                className="coffee-inventory__button coffee-inventory__button--edit"
                onClick={() => {
                  setSelectedFlavors([]);
                  setEditingCoffee(coffee);
                }}>
                Edit
              </button>
            {coffee.isBones ? <div className="coffee-inventory__tag--bones"><img src={bonesLogo} alt="Bones Logo"/></div> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
