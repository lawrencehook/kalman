/**
 * Custom Dropdown Component
 * Creates beautiful custom dropdowns with tooltip-like styling
 */

class CustomDropdown {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            placeholder: 'Select option...',
            items: [],
            onSelect: null,
            className: 'custom-dropdown',
            ...options
        };
        
        this.isOpen = false;
        this.selectedItem = null;
        this.dropdownElement = null;
        this.optionsElement = null;
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error(`Custom dropdown container not found: ${this.containerId}`);
            return;
        }
        
        this.createDropdown();
        this.bindEvents();
    }
    
    createDropdown() {
        // Create main dropdown element
        this.dropdownElement = document.createElement('div');
        this.dropdownElement.className = `${this.options.className} dropdown-closed`;
        
        // Create selected display
        this.selectedDisplay = document.createElement('div');
        this.selectedDisplay.className = 'dropdown-selected';
        this.selectedDisplay.textContent = this.selectedItem ? this.selectedItem.label : this.options.placeholder;
        
        // Create options container
        this.optionsElement = document.createElement('div');
        this.optionsElement.className = 'dropdown-options';
        
        // Assemble dropdown
        this.dropdownElement.appendChild(this.selectedDisplay);
        this.dropdownElement.appendChild(this.optionsElement);
        
        // Add to container
        this.container.appendChild(this.dropdownElement);
        
        // Populate options
        this.updateOptions(this.options.items);
    }
    
    updateOptions(items) {
        this.options.items = items;
        this.optionsElement.innerHTML = '';
        
        items.forEach(item => {
            const optionElement = document.createElement('div');
            optionElement.className = 'dropdown-option';
            optionElement.textContent = item.label;
            optionElement.dataset.value = item.value;
            if (item.description) {
                optionElement.title = item.description;
            }
            
            optionElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectItem(item);
                this.close();
            });
            
            this.optionsElement.appendChild(optionElement);
        });
        
        // Select first item by default if none selected
        if (!this.selectedItem && items.length > 0) {
            this.selectItem(items[0], false);
        }
    }
    
    selectItem(item, triggerCallback = true) {
        this.selectedItem = item;
        this.selectedDisplay.textContent = item.label;
        
        // Update selected visual state
        this.optionsElement.querySelectorAll('.dropdown-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.value === item.value) {
                opt.classList.add('selected');
            }
        });
        
        if (triggerCallback && this.options.onSelect) {
            this.options.onSelect(item);
        }
    }
    
    bindEvents() {
        // Toggle dropdown on click
        this.selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dropdownElement.contains(e.target)) {
                this.close();
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.dropdownElement.classList.remove('dropdown-closed');
        this.dropdownElement.classList.add('dropdown-open');
        
        // Close other dropdowns
        document.querySelectorAll('.custom-dropdown.dropdown-open').forEach(dropdown => {
            if (dropdown !== this.dropdownElement) {
                dropdown.classList.remove('dropdown-open');
                dropdown.classList.add('dropdown-closed');
            }
        });
    }
    
    close() {
        this.isOpen = false;
        this.dropdownElement.classList.remove('dropdown-open');
        this.dropdownElement.classList.add('dropdown-closed');
    }
    
    getSelectedValue() {
        return this.selectedItem ? this.selectedItem.value : null;
    }
    
    setSelectedValue(value) {
        const item = this.options.items.find(item => item.value === value);
        if (item) {
            this.selectItem(item);
        }
    }
    
    destroy() {
        if (this.dropdownElement) {
            this.dropdownElement.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomDropdown;
}