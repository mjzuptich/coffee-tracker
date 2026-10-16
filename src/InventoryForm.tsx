import { useState } from 'react'
import type { Coffee } from './data/coffee'

type InventoryFormProps = {  
  coffeeToEdit: Coffee | null
  onAdd: (coffee: Coffee) => Promise<void>
  onUpdate: (coffee: Coffee) => Promise<void>
  onCancel: () => void
  availableFlavors: string[]
}

const emptyCoffee: Coffee = {
  id: '',
  name: '',
  flavorDescription: '',
  flavorKeywords: [],
  quantity: 1,
  isOpen: false,
  isLow: false,
  isBones: false,
  updatedAt: '',
}

function InventoryForm({
    coffeeToEdit,
    onAdd,
    onUpdate,
    onCancel,
    availableFlavors
  }:
InventoryFormProps) {
  const [inventory, setInventory] = useState<Coffee>(coffeeToEdit ?? emptyCoffee);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = event.target;

    setInventory((prevInventory) => {
      let finalValue: any = type === 'checkbox' ? checked : name === 'quantity' ? Number(value) : value;
      return {
        ...prevInventory,
        [name]: finalValue,
        ...(name === 'isOpen' && !checked ? { isLow: false } : {}),
      };
    })
  }
  const addFlavor = (value: string = flavorInput) => {
    const flavors = value.split(',').map((flavor) => flavor.trim().toLowerCase()).filter((flavor) => flavor.length > 0);
    setInventory((prevInventory) => ({
      ...prevInventory,
      flavorKeywords: [
        ...new Set([
          ...prevInventory.flavorKeywords.map((flavor) =>
            flavor.trim().toLowerCase()
          ),
          ...flavors,
        ]),
      ],
    }));

    setFlavorInput('');
  };
  const removeFlavor = (flavorToRemove: string) => {
    setInventory((prevInventory) => ({
      ...prevInventory,
      flavorKeywords: prevInventory.flavorKeywords.filter(
        (flavor) => flavor !== flavorToRemove
      ),
    }));
  };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const coffee: Coffee = {
      ...inventory,
      id: inventory.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };

    if (inventory.id) {
      await onUpdate(coffee)
    } else {
      await onAdd(coffee)
    }

    setInventory(emptyCoffee)
  };

  const [flavorInput, setFlavorInput] = useState('');
  const currentFlavor = flavorInput.split(',').pop()?.trim().toLowerCase() ?? '';
  const suggestedFlavors = currentFlavor ? availableFlavors.filter(
    (flavor) => flavor.startsWith(currentFlavor) &&
    !inventory.flavorKeywords.some((selectedFlavor) =>
    selectedFlavor.toLowerCase() === flavor)
  ) : [];
  return (
    <div className="coffee__form">
        <h2>{coffeeToEdit ? 'Editing' : 'Add a Coffee'}</h2>
        <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name: </label>
            <input
                type="text"
                id="name"
                name="name"
                value={inventory?.name || ''}
                onChange={handleChange}
                required
            />
            <label htmlFor="flavorDescription">Flavor Description: </label>
            <input
                type="text"
                id="flavorDescription"
                name="flavorDescription"
                value={inventory?.flavorDescription || ''}
                onChange={handleChange}
            />
            
            <label htmlFor="flavorKeywords">Keywords: </label>
            <div className="coffee__form--flex">
              <input
                type="text"
                id="flavorKeywords"
                name="flavorKeywords"
                value={flavorInput}
                onChange={(event) => setFlavorInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    addFlavor();
                  }
                }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => addFlavor()}
                disabled={!flavorInput.trim()}>Add
              </button>
            </div>              
            <div className="flavor-suggestions">
              {suggestedFlavors.map((flavor) => (
              <button
                type="button"
                key={flavor}
                onClick={() => {
                  const flavors = flavorInput.split(',');
                  flavors[flavors.length - 1] = flavor;
                  addFlavor(flavors.join(','));
                }}>
                {flavor}
              </button>
              ))}
            </div>
            
            <div className="flavor-tags">
              {inventory.flavorKeywords.map((flavor) => (
                <span className="flavor-tag" key={flavor}>
                  {flavor}
                  <button
                    type="button"
                    className="flavor-tag-remove"
                    aria-label={`Remove ${flavor}`}
                    onClick={() => removeFlavor(flavor)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <label htmlFor="quantity">Quantity: </label>
            <div className="coffee__form--flex coffee__form-checkboxes">
            <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                step="1"
                required
                value={inventory.quantity}
                onChange={handleChange}
            />            
            <div className="coffee__form-checkbox">
            <label htmlFor="isBones">Bones</label>
              <input
                  type="checkbox"
                  id="isBones"
                  name="isBones"
                  checked={inventory?.isBones || false}
                  onChange={handleChange}
              />
            </div>
            <div className="coffee__form-checkbox">
              <label htmlFor="isOpen">Open</label>
              <input
                  type="checkbox"
                  id="isOpen"
                  name="isOpen"
                  checked={inventory.isOpen || false}
                  onChange={handleChange}
              />
            </div>
            <div className="coffee__form-checkbox">
              <label htmlFor="isLow">Low</label>
              <input
                  type="checkbox"
                  id="isLow"
                  name="isLow"
                  checked={inventory?.isLow || false}
                  onChange={handleChange}
                  disabled={!inventory.isOpen}
              />
            </div>
          </div>
            <button type="submit">
              {coffeeToEdit ? 'Update Coffee' : 'Add to Inventory'}
            </button>
            {coffeeToEdit && (
              <button
                type="button"
                onClick={onCancel}
              >Cancel
            </button>
            )}
        </form>
    </div>
  );
}

export default InventoryForm;