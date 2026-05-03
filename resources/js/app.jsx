import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    AlertTriangle,
    Boxes,
    Building2,
    ClipboardList,
    Info,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Package,
    Plus,
    RefreshCw,
    ScanLine,
    Settings,
    ShieldCheck,
    Truck,
    UserPlus,
    Users,
} from 'lucide-react';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const today = new Date().toISOString().slice(0, 10);
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
const appVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content') ?? '1.0.0';

const emptyProduct = {
    sku: '',
    barcode: '',
    name: '',
    category_id: '',
    preferred_supplier_id: '',
    unit_of_measure: 'each',
    cost_price: '0',
    sale_price: '0',
    reorder_point: '0',
    reorder_quantity: '0',
    location_id: '',
    opening_quantity: '0',
};

const emptyMovement = {
    product_id: '',
    location_id: '',
    movement_type: 'receive',
    quantity: '1',
    movement_date: today,
    unit_cost: '',
    supplier_id: '',
    reason_code: 'Restock',
    reason: '',
    reference_number: '',
    to_location_id: '',
};

const reasonOptions = {
    receive: ['Restock', 'Purchase order', 'Return from customer', 'Found inventory', 'Other'],
    issue: ['Sold', 'Damaged', 'Lost', 'Returned to supplier', 'Internal use', 'Other'],
    adjust: ['Cycle count', 'Correction', 'Audit adjustment', 'Other'],
    transfer: ['Relocation', 'Store replenishment', 'Bin move', 'Other'],
};

const emptySupplier = {
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    notes: '',
};

const emptyCustomer = {
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
};

const emptyLocation = {
    name: '',
    type: 'warehouse',
    code: '',
    parent_id: '',
    address: '',
    notes: '',
};

const emptyPassword = {
    current_password: '',
    password: '',
    password_confirmation: '',
};

const emptyUser = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_admin: false,
};

async function apiJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        ...options,
    });
    const data = await response.json();
    if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Please log in.');
    }
    if (!response.ok) {
        const errors = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
        throw new Error(errors || 'Request failed.');
    }
    return data;
}

async function apiForm(url, formData) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        const errors = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
        throw new Error(errors || 'Request failed.');
    }
    return data;
}

function MetricCard({ icon: Icon, label, value, tone = 'blue', onClick, active }) {
    return (
        <button className={`metric metric-${tone} ${active ? 'active' : ''}`} onClick={onClick} type="button">
            <div className="metric-icon"><Icon size={22} /></div>
            <div>
                <div className="metric-label">{label}</div>
                <div className="metric-value">{value}</div>
            </div>
        </button>
    );
}

function Modal({ title, children, onClose }) {
    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button type="button" className="ghost-button" onClick={onClose}>Close</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ProductForm({ options, onSave, onCancel }) {
    const [form, setForm] = useState({ ...emptyProduct, location_id: options.locations[0]?.id ?? '' });
    const [error, setError] = useState('');

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(form);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <label>SKU<input required value={form.sku} onChange={(event) => update('sku', event.target.value)} /></label>
            <label>Barcode<input value={form.barcode} onChange={(event) => update('barcode', event.target.value)} /></label>
            <label className="wide">Product Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label>Brand<input value={form.brand || ''} onChange={(event) => update('brand', event.target.value)} /></label>
            <label>Category<select value={form.category_id} onChange={(event) => update('category_id', event.target.value)}><option value="">None</option>{options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Supplier<select value={form.preferred_supplier_id} onChange={(event) => update('preferred_supplier_id', event.target.value)}><option value="">None</option>{options.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
            <label>Unit<input required value={form.unit_of_measure} onChange={(event) => update('unit_of_measure', event.target.value)} /></label>
            <label>Cost<input type="number" min="0" step="0.01" value={form.cost_price} onChange={(event) => update('cost_price', event.target.value)} /></label>
            <label>Sale Price<input type="number" min="0" step="0.01" value={form.sale_price} onChange={(event) => update('sale_price', event.target.value)} /></label>
            <label>Reorder Point<input type="number" min="0" step="0.01" value={form.reorder_point} onChange={(event) => update('reorder_point', event.target.value)} /></label>
            <label>Reorder Qty<input type="number" min="0" step="0.01" value={form.reorder_quantity} onChange={(event) => update('reorder_quantity', event.target.value)} /></label>
            <label>Initial Location<select required value={form.location_id} onChange={(event) => update('location_id', event.target.value)}>{options.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <label>Opening Qty<input type="number" min="0" step="0.01" value={form.opening_quantity} onChange={(event) => update('opening_quantity', event.target.value)} /></label>
            <label className="wide">Notes<input value={form.notes || ''} onChange={(event) => update('notes', event.target.value)} /></label>
            <div className="form-actions wide">
                <button type="button" className="ghost-button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="primary-button">Save Product</button>
            </div>
        </form>
    );
}

function MovementForm({ products, options, initialProduct, initialType = 'receive', onSave, onCancel }) {
    const [form, setForm] = useState({
        ...emptyMovement,
        product_id: initialProduct?.id ?? products[0]?.id ?? '',
        location_id: options.locations[0]?.id ?? '',
        movement_type: initialType,
        reason_code: reasonOptions[initialType][0],
    });
    const [error, setError] = useState('');
    const availableReasons = reasonOptions[form.movement_type] || reasonOptions.receive;
    const selectedProduct = products.find((product) => String(product.id) === String(form.product_id));

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
    const updateType = (value) => {
        setForm((current) => ({
            ...current,
            movement_type: value,
            reason_code: reasonOptions[value][0],
            unit_cost: value === 'receive' ? (current.unit_cost || selectedProduct?.cost_price || '') : '',
        }));
    };

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(form);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <label className="wide">Product<select required value={form.product_id} onChange={(event) => update('product_id', event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}</select></label>
            <label>Location<select required value={form.location_id} onChange={(event) => update('location_id', event.target.value)}>{options.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <label>Action<select value={form.movement_type} onChange={(event) => updateType(event.target.value)}><option value="receive">Receive</option><option value="issue">Remove / Issue</option><option value="adjust">Set Count</option><option value="transfer">Transfer</option></select></label>
            <label>{form.movement_type === 'issue' ? 'Sold / Removed Date' : form.movement_type === 'transfer' ? 'Transfer Date' : 'Received Date'}<input type="date" value={form.movement_date} onChange={(event) => update('movement_date', event.target.value)} /></label>
            <label>Quantity<input type="number" min="0.01" step="0.01" required value={form.quantity} onChange={(event) => update('quantity', event.target.value)} /></label>
            {form.movement_type === 'transfer' && (
                <label>To Location<select required value={form.to_location_id || ''} onChange={(event) => update('to_location_id', event.target.value)}><option value="">Choose destination</option>{options.locations.filter((location) => String(location.id) !== String(form.location_id)).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            )}
            {form.movement_type === 'receive' && (
                <>
                    <label>Purchase Unit Cost<input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(event) => update('unit_cost', event.target.value)} placeholder={selectedProduct ? `Current avg ${money.format(selectedProduct.cost_price)}` : '0.00'} /></label>
                    <label>Supplier<select value={form.supplier_id || ''} onChange={(event) => update('supplier_id', event.target.value)}><option value="">Use product supplier</option>{options.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
                </>
            )}
            <label>Reason<select value={form.reason_code} onChange={(event) => update('reason_code', event.target.value)}>{availableReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label>
            <label>Reference<input value={form.reference_number} onChange={(event) => update('reference_number', event.target.value)} placeholder="PO, invoice, note..." /></label>
            {form.movement_type === 'issue' && (
                <label className="wide">Sold To / Customer<select value={form.customer_id || ''} onChange={(event) => update('customer_id', event.target.value)}><option value="">No customer selected</option>{options.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
            )}
            <label className="wide">Reason Details<input value={form.reason} onChange={(event) => update('reason', event.target.value)} placeholder="Optional notes, customer/order number, damage details..." /></label>
            <div className="form-actions wide">
                <button type="button" className="ghost-button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="primary-button">Update Stock</button>
            </div>
        </form>
    );
}

function SupplierForm({ onSave, onCancel }) {
    const [form, setForm] = useState(emptySupplier);
    const [error, setError] = useState('');

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(form);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <label className="wide">Supplier Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label>Contact<input value={form.contact_name} onChange={(event) => update('contact_name', event.target.value)} /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
            <label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
            <label>Website<input value={form.website} onChange={(event) => update('website', event.target.value)} /></label>
            <label className="wide">Address<input value={form.address} onChange={(event) => update('address', event.target.value)} /></label>
            <label className="wide">Notes<input value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
            <div className="form-actions wide">
                <button type="button" className="ghost-button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="primary-button">Save Supplier</button>
            </div>
        </form>
    );
}

function CustomerForm({ onSave, onCancel }) {
    const [form, setForm] = useState(emptyCustomer);
    const [error, setError] = useState('');

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(form);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <label className="wide">Customer Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label>Contact<input value={form.contact_name} onChange={(event) => update('contact_name', event.target.value)} /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
            <label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
            <label className="wide">Address<input value={form.address} onChange={(event) => update('address', event.target.value)} /></label>
            <label className="wide">Notes<input value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
            <div className="form-actions wide">
                <button type="button" className="ghost-button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="primary-button">Save Customer</button>
            </div>
        </form>
    );
}

function LocationForm({ locations, onSave, onCancel }) {
    const [form, setForm] = useState(emptyLocation);
    const [error, setError] = useState('');

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(form);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <label className="wide">Location Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label>Type<select value={form.type} onChange={(event) => update('type', event.target.value)}><option value="warehouse">Warehouse</option><option value="store">Store</option><option value="room">Room</option><option value="shelf">Shelf</option><option value="bin">Bin</option></select></label>
            <label>Code<input value={form.code} onChange={(event) => update('code', event.target.value)} placeholder="WH-A, BIN-01..." /></label>
            <label className="wide">Parent Location<select value={form.parent_id} onChange={(event) => update('parent_id', event.target.value)}><option value="">None</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <label className="wide">Address<input value={form.address} onChange={(event) => update('address', event.target.value)} /></label>
            <label className="wide">Notes<input value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
            <div className="form-actions wide">
                <button type="button" className="ghost-button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="primary-button">Save Location</button>
            </div>
        </form>
    );
}

function ProductSettingsForm({ product, onSave, onCancel }) {
    const [form, setForm] = useState({
        sku: product.sku || '',
        barcode: product.barcode || '',
        name: product.name || '',
        category_id: product.category_id || '',
        preferred_supplier_id: product.preferred_supplier_id || '',
        unit_of_measure: product.unit || 'each',
        reorder_point: product.reorder_point,
        reorder_quantity: product.reorder_quantity,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        brand: product.brand || '',
        description: product.description || '',
        notes: product.notes || '',
        is_active: product.is_active,
    });
    const [error, setError] = useState('');

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(product, form);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <div className="wide form-heading">{product.sku} - {product.name}</div>
            <label>SKU<input required value={form.sku} onChange={(event) => update('sku', event.target.value)} /></label>
            <label>Barcode<input value={form.barcode || ''} onChange={(event) => update('barcode', event.target.value)} /></label>
            <label className="wide">Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label>Brand<input value={form.brand || ''} onChange={(event) => update('brand', event.target.value)} /></label>
            <label>Unit<input required value={form.unit_of_measure} onChange={(event) => update('unit_of_measure', event.target.value)} /></label>
            <label>Reorder Point<input type="number" min="0" step="0.01" required value={form.reorder_point} onChange={(event) => update('reorder_point', event.target.value)} /></label>
            <label>Reorder Qty<input type="number" min="0" step="0.01" required value={form.reorder_quantity} onChange={(event) => update('reorder_quantity', event.target.value)} /></label>
            <label>Cost<input type="number" min="0" step="0.01" required value={form.cost_price} onChange={(event) => update('cost_price', event.target.value)} /></label>
            <label>Sale Price<input type="number" min="0" step="0.01" required value={form.sale_price} onChange={(event) => update('sale_price', event.target.value)} /></label>
            <label className="wide">Notes<input value={form.notes || ''} onChange={(event) => update('notes', event.target.value)} /></label>
            <label className="check-row wide"><input type="checkbox" checked={form.is_active} onChange={(event) => update('is_active', event.target.checked)} /> Active product</label>
            <div className="form-actions wide">
                <button type="button" className="ghost-button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="primary-button">Save Settings</button>
            </div>
        </form>
    );
}

function AdminPasswordForm({ onSave }) {
    const [form, setForm] = useState(emptyPassword);
    const [error, setError] = useState('');

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(form);
            setForm(emptyPassword);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid system-form" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <label className="wide">Current Password<input type="password" value={form.current_password} onChange={(event) => update('current_password', event.target.value)} autoComplete="current-password" /></label>
            <label>New Password<input type="password" minLength="4" required value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" /></label>
            <label>Confirm Password<input type="password" minLength="4" required value={form.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} autoComplete="new-password" /></label>
            <div className="form-actions wide">
                <button type="submit" className="primary-button"><KeyRound size={18} />Save Password</button>
            </div>
        </form>
    );
}

function UserForm({ onSave }) {
    const [form, setForm] = useState(emptyUser);
    const [error, setError] = useState('');

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    async function submit(event) {
        event.preventDefault();
        setError('');
        try {
            await onSave(form);
            setForm(emptyUser);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form-grid system-form" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <label>Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" /></label>
            <label>Email<input type="email" required value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="username" /></label>
            <label>Password<input type="password" minLength="4" required value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" /></label>
            <label>Confirm Password<input type="password" minLength="4" required value={form.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} autoComplete="new-password" /></label>
            <label className="check-row wide"><input type="checkbox" checked={form.is_admin} onChange={(event) => update('is_admin', event.target.checked)} /> Administrator</label>
            <div className="form-actions wide">
                <button type="submit" className="primary-button"><UserPlus size={18} />Add User</button>
            </div>
        </form>
    );
}

function UserDatabase({ users, onResetPassword }) {
    const [passwords, setPasswords] = useState({});
    const [error, setError] = useState('');

    const update = (id, field, value) => setPasswords((current) => ({
        ...current,
        [id]: { password: '', password_confirmation: '', ...(current[id] || {}), [field]: value },
    }));

    async function resetPassword(event, user) {
        event.preventDefault();
        setError('');
        try {
            await onResetPassword(user, passwords[user.id] || {});
            setPasswords((current) => ({ ...current, [user.id]: { password: '', password_confirmation: '' } }));
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="user-database">
            {error && <div className="form-error">{error}</div>}
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Updated</th><th>Reset Password</th></tr></thead>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.updated_at || 'Never'}</td>
                            <td>
                                <form className="inline-password-form" onSubmit={(event) => resetPassword(event, user)}>
                                    <input type="password" minLength="4" required placeholder="New password" value={passwords[user.id]?.password || ''} onChange={(event) => update(user.id, 'password', event.target.value)} />
                                    <input type="password" minLength="4" required placeholder="Confirm" value={passwords[user.id]?.password_confirmation || ''} onChange={(event) => update(user.id, 'password_confirmation', event.target.value)} />
                                    <button type="submit" className="table-button neutral">Save</button>
                                </form>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AboutContent() {
    return (
        <div className="about-box">
            <img src="/images/logo2.jpeg" alt="StockPilot logo" />
            <div>
                <h3>StockPilot</h3>
                <p>Version {appVersion}</p>
                <p>Support: dave@daves-corner.com</p>
            </div>
        </div>
    );
}

function App() {
    const [overview, setOverview] = useState(null);
    const [options, setOptions] = useState({ categories: [], suppliers: [], locations: [], customers: [] });
    const [query, setQuery] = useState('');
    const [view, setView] = useState('dashboard');
    const [modal, setModal] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [movementType, setMovementType] = useState('receive');
    const [notice, setNotice] = useState('');
    const [purchaseFilters, setPurchaseFilters] = useState({ product: '', supplier: '', from: '', to: '' });
    const [systemUsers, setSystemUsers] = useState([]);
    const importInputRef = useRef(null);

    async function loadData() {
        const params = new URLSearchParams(Object.entries(purchaseFilters).filter(([, value]) => value));
        const [overviewData, optionData] = await Promise.all([
            apiJson(`/api/overview${params.toString() ? `?${params}` : ''}`),
            apiJson('/api/options'),
        ]);
        setOverview(overviewData);
        setOptions(optionData);
    }

    async function loadSystemUsers() {
        const data = await apiJson('/api/system/users');
        setSystemUsers(data.users);
    }

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (view === 'purchases') {
            loadData();
        }
    }, [purchaseFilters]);

    useEffect(() => {
        if (view === 'system') {
            loadSystemUsers();
        }
    }, [view]);

    const products = useMemo(() => {
        if (!overview) return [];
        const needle = query.trim().toLowerCase();
        if (!needle) return overview.products;

        return overview.products.filter((product) =>
            [product.sku, product.barcode, product.name, product.category, product.supplier]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(needle))
        );
    }, [overview, query]);

    const purchases = useMemo(() => {
        if (!overview) return [];
        return overview.purchases.filter((purchase) => {
            const productMatch = !purchaseFilters.product || purchase.product === purchaseFilters.product;
            const supplierMatch = !purchaseFilters.supplier || purchase.supplier === purchaseFilters.supplier;
            const purchaseDate = purchase.purchased_at ? new Date(purchase.purchased_at) : null;
            const fromMatch = !purchaseFilters.from || (purchaseDate && purchaseDate >= new Date(purchaseFilters.from));
            const toMatch = !purchaseFilters.to || (purchaseDate && purchaseDate <= new Date(`${purchaseFilters.to}T23:59:59`));
            return productMatch && supplierMatch && fromMatch && toMatch;
        });
    }, [overview, purchaseFilters]);

    async function saveProduct(form) {
        const result = await apiJson('/api/products', { method: 'POST', body: JSON.stringify(form) });
        setNotice(result.message);
        setModal(null);
        await loadData();
    }

    async function saveMovement(form) {
        const result = await apiJson('/api/movements', { method: 'POST', body: JSON.stringify(form) });
        setNotice(result.message);
        setModal(null);
        await loadData();
    }

    async function importProducts(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('location_id', options.locations[0]?.id ?? '');
        const result = await apiForm('/api/products/import', formData);
        setNotice(result.message);
        await loadData();
    }

    async function saveSupplier(form) {
        const result = await apiJson('/api/suppliers', { method: 'POST', body: JSON.stringify(form) });
        setNotice(result.message);
        setModal(null);
        await loadData();
    }

    async function saveLocation(form) {
        const result = await apiJson('/api/locations', { method: 'POST', body: JSON.stringify(form) });
        setNotice(result.message);
        setModal(null);
        await loadData();
    }

    async function saveCustomer(form) {
        const result = await apiJson('/api/customers', { method: 'POST', body: JSON.stringify(form) });
        setNotice(result.message);
        setModal(null);
        await loadData();
    }

    async function saveProductSettings(product, form) {
        const result = await apiJson(`/api/products/${product.id}`, { method: 'PUT', body: JSON.stringify(form) });
        setNotice(result.message);
        setModal(null);
        await loadData();
    }

    async function saveAdminPassword(form) {
        const result = await apiJson('/api/system/admin-password', { method: 'PUT', body: JSON.stringify(form) });
        setNotice(result.message);
        await loadSystemUsers();
    }

    async function saveUser(form) {
        const result = await apiJson('/api/system/users', { method: 'POST', body: JSON.stringify(form) });
        setNotice(result.message);
        await loadSystemUsers();
    }

    async function resetUserPassword(user, form) {
        const result = await apiJson(`/api/system/users/${user.id}/password`, { method: 'PUT', body: JSON.stringify(form) });
        setNotice(result.message);
        await loadSystemUsers();
    }

    async function logout() {
        await apiJson('/logout', { method: 'POST', body: JSON.stringify({}) });
        window.location.href = '/login';
    }

    if (!overview) {
        return <main className="loading">Loading StockPilot...</main>;
    }

    return (
        <main className="app-shell">
            <header className="topbar">
                <div>
                    <div className="eyebrow">Dave's Corner Open Source</div>
                    <h1>StockPilot</h1>
                    <p>Inventory control for products, locations, suppliers, barcode lookup, and stock movement.</p>
                </div>
                <div className="action-row">
                    <button type="button" className="ghost-button" onClick={() => setModal('about')}><Info size={18} />About</button>
                    <button type="button" className="ghost-button" onClick={loadData}><RefreshCw size={18} />Refresh</button>
                    <button type="button" className="ghost-button" onClick={logout}><LogOut size={18} />Log Out</button>
                </div>
            </header>

            {notice && <button className="notice" type="button" onClick={() => setNotice('')}>{notice}</button>}

            <nav className="tabs" aria-label="Inventory views">
                <button className={view === 'dashboard' ? 'selected' : ''} onClick={() => setView('dashboard')} type="button"><LayoutDashboard size={18} />Dashboard</button>
                <button className={view === 'products' ? 'selected' : ''} onClick={() => setView('products')} type="button"><Package size={18} />Products</button>
                <button className={view === 'suppliers' ? 'selected' : ''} onClick={() => setView('suppliers')} type="button"><Truck size={18} />Suppliers</button>
                <button className={view === 'customers' ? 'selected' : ''} onClick={() => setView('customers')} type="button"><Plus size={18} />Customers</button>
                <button className={view === 'locations' ? 'selected' : ''} onClick={() => setView('locations')} type="button"><Building2 size={18} />Locations</button>
                <button className={view === 'low' ? 'selected' : ''} onClick={() => setView('low')} type="button"><AlertTriangle size={18} />Low Stock</button>
                <button className={view === 'movements' ? 'selected' : ''} onClick={() => setView('movements')} type="button"><ClipboardList size={18} />Movements</button>
                <button className={view === 'purchases' ? 'selected' : ''} onClick={() => setView('purchases')} type="button"><Boxes size={18} />Purchases</button>
                {overview.current_user?.is_admin && <button className={view === 'system' ? 'selected' : ''} onClick={() => setView('system')} type="button"><Settings size={18} />System</button>}
            </nav>

            <section className="metrics-grid">
                <MetricCard icon={Package} label="Products" value={overview.metrics.products} active={view === 'products'} onClick={() => setView('products')} />
                <MetricCard icon={Building2} label="Locations" value={overview.metrics.locations} tone="green" active={view === 'locations'} onClick={() => setView('locations')} />
                <MetricCard icon={Truck} label="Suppliers" value={overview.metrics.suppliers} tone="amber" active={view === 'suppliers'} onClick={() => setView('suppliers')} />
                <MetricCard icon={Plus} label="Customers" value={overview.metrics.customers} tone="violet" active={view === 'customers'} onClick={() => setView('customers')} />
                <MetricCard icon={Boxes} label="Stock Value" value={money.format(overview.metrics.stock_value)} tone="violet" />
                <MetricCard icon={AlertTriangle} label="Low Stock" value={overview.metrics.low_stock} tone="red" active={view === 'low'} onClick={() => setView('low')} />
            </section>

            {(view === 'dashboard' || view === 'products') && (
                <section className="panel product-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Products</h2>
                            <p>Click a row to select it, then receive, issue, or adjust stock.</p>
                        </div>
                        <div className="section-actions">
                            <div className="search-wrap">
                                <ScanLine size={18} />
                                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Scan or search..." aria-label="Search inventory" />
                            </div>
                            <button type="button" className="primary-button" onClick={() => setModal('product')}><Plus size={18} />Add Product</button>
                            <button type="button" className="primary-button green" onClick={() => { setMovementType('receive'); setModal('movement'); }}><Boxes size={18} />Receive</button>
                            <button type="button" className="primary-button red" onClick={() => { setMovementType('issue'); setModal('movement'); }}><AlertTriangle size={18} />Remove</button>
                            <button type="button" className="primary-button blue" onClick={() => { setMovementType('transfer'); setModal('movement'); }}><Building2 size={18} />Transfer</button>
                            <button type="button" className="ghost-button" onClick={() => { window.location.href = '/api/products/export'; }}>Export CSV</button>
                            <button type="button" className="ghost-button" onClick={() => importInputRef.current?.click()}>Import CSV</button>
                            <input ref={importInputRef} type="file" accept=".csv,text/csv" className="visually-hidden" onChange={importProducts} />
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>SKU</th><th>Product</th><th>Available</th><th>Reorder</th><th>Received</th><th>Sold</th><th>Supplier</th><th>Price</th><th>Action</th></tr></thead>
                            <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className={selectedProduct?.id === product.id ? 'row-selected' : ''} onClick={() => setSelectedProduct(product)}>
                                    <td><code>{product.sku}</code></td>
                                    <td><strong>{product.name}</strong><span>{product.category} / {product.unit}</span></td>
                                    <td>{product.quantity_available}</td>
                                    <td>{product.reorder_point}</td>
                                    <td>{product.last_received_at || 'Never'}</td>
                                    <td>{product.last_sold_at || 'Never'}</td>
                                    <td>{product.supplier}</td>
                                    <td>{money.format(product.sale_price)}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button type="button" className="table-button" onClick={(event) => { event.stopPropagation(); setSelectedProduct(product); setMovementType('receive'); setModal('movement'); }}>Add</button>
                                            <button type="button" className="table-button danger" onClick={(event) => { event.stopPropagation(); setSelectedProduct(product); setMovementType('issue'); setModal('movement'); }}>Remove</button>
                                            <button type="button" className="table-button" onClick={(event) => { event.stopPropagation(); setSelectedProduct(product); setMovementType('transfer'); setModal('movement'); }}>Transfer</button>
                                            <button type="button" className="table-button neutral" onClick={(event) => { event.stopPropagation(); setSelectedProduct(product); setModal('product-settings'); }}>Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {view === 'suppliers' && (
                <section className="panel">
                    <div className="panel-header">
                        <div>
                            <h2>Suppliers</h2>
                            <p>Add and review vendors used as preferred suppliers for products.</p>
                        </div>
                        <button type="button" className="primary-button amber" onClick={() => setModal('supplier')}><Plus size={18} />Add Supplier</button>
                    </div>
                    <div className="supplier-grid">
                        {overview.suppliers.map((supplier) => (
                            <article className="supplier-card" key={supplier.id}>
                                <strong>{supplier.name}</strong>
                                <span>{supplier.contact_name || 'No contact listed'}</span>
                                <span>{supplier.email || supplier.phone || 'No contact details'}</span>
                                <b>{supplier.products_count} products</b>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {view === 'locations' && (
                <section className="panel">
                    <div className="panel-header">
                        <div>
                            <h2>Locations</h2>
                            <p>Add warehouses, rooms, shelves, bins, or stores where inventory is kept.</p>
                        </div>
                        <button type="button" className="primary-button blue" onClick={() => setModal('location')}><Plus size={18} />Add Location</button>
                    </div>
                    <div className="supplier-grid">
                        {overview.locations.map((location) => (
                            <article className="supplier-card" key={location.id}>
                                <strong>{location.name}</strong>
                                <span>{location.type}</span>
                                <span>{location.code || 'No code'}</span>
                                <b>{location.address || 'No address'}</b>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {view === 'customers' && (
                <section className="panel">
                    <div className="panel-header">
                        <div>
                            <h2>Customers</h2>
                            <p>Add customers so sold stock can record who bought the item.</p>
                        </div>
                        <button type="button" className="primary-button purple" onClick={() => setModal('customer')}><Plus size={18} />Add Customer</button>
                    </div>
                    <div className="supplier-grid">
                        {overview.customers.map((customer) => (
                            <article className="supplier-card" key={customer.id}>
                                <strong>{customer.name}</strong>
                                <span>{customer.contact_name || 'No contact listed'}</span>
                                <span>{customer.email || customer.phone || 'No contact details'}</span>
                                <b>{customer.stock_movements_count} stock removals</b>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {(view === 'dashboard' || view === 'low' || view === 'movements' || view === 'purchases') && (
                <section className="workspace">
                    {(view === 'dashboard' || view === 'low') && (
                        <div className="panel">
                            <div className="panel-header compact"><h2>Low Stock</h2><AlertTriangle size={20} /></div>
                            <div className="list">
                                {overview.low_stock.map((item) => (
                                    <button className="list-row clickable" key={item.sku} type="button" onClick={() => { setQuery(item.sku); setView('products'); }}>
                                        <div><strong>{item.name}</strong><span>{item.supplier}</span></div>
                                        <b>{item.available} / {item.reorder_point}</b>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(view === 'dashboard' || view === 'movements') && (
                        <div className="panel">
                            <div className="panel-header compact"><h2>Recent Movement</h2><ClipboardList size={20} /></div>
                            <div className="list">
                                {overview.movements.map((movement) => (
                                    <div className="movement" key={movement.id}>
                                        <strong>{movement.type.toUpperCase()} {movement.quantity}</strong>
                                        <span>{movement.product}</span>
                                        {movement.to && <span>To: {movement.to}</span>}
                                        {movement.customer && <span>Sold to: {movement.customer}</span>}
                                        {movement.created_by && <small>By {movement.created_by}</small>}
                                        <small>{movement.reason}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(view === 'dashboard' || view === 'purchases') && (
                        <div className="panel purchase-panel">
                            <div className="panel-header compact"><h2>Purchase History</h2><Boxes size={20} /></div>
                            <div className="filter-grid">
                                <label>Product<select value={purchaseFilters.product} onChange={(event) => setPurchaseFilters((current) => ({ ...current, product: event.target.value }))}><option value="">All products</option>{[...new Set(overview.purchases.map((purchase) => purchase.product).filter(Boolean))].map((product) => <option key={product} value={product}>{product}</option>)}</select></label>
                                <label>Supplier<select value={purchaseFilters.supplier} onChange={(event) => setPurchaseFilters((current) => ({ ...current, supplier: event.target.value }))}><option value="">All suppliers</option>{[...new Set(overview.purchases.map((purchase) => purchase.supplier).filter(Boolean))].map((supplier) => <option key={supplier} value={supplier}>{supplier}</option>)}</select></label>
                                <label>From<input type="date" value={purchaseFilters.from} onChange={(event) => setPurchaseFilters((current) => ({ ...current, from: event.target.value }))} /></label>
                                <label>To<input type="date" value={purchaseFilters.to} onChange={(event) => setPurchaseFilters((current) => ({ ...current, to: event.target.value }))} /></label>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Date</th><th>Product</th><th>Supplier</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th>Reference</th></tr></thead>
                                    <tbody>
                                    {purchases.map((purchase) => (
                                        <tr key={purchase.id}>
                                            <td>{purchase.purchased_at || 'No date'}</td>
                                            <td>{purchase.product}</td>
                                            <td>{purchase.supplier || 'No supplier'}</td>
                                            <td>{purchase.quantity}</td>
                                            <td>{money.format(purchase.unit_cost)}</td>
                                            <td>{money.format(purchase.quantity * purchase.unit_cost)}</td>
                                            <td>{purchase.reference || 'No reference'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {view === 'system' && (
                <section className="system-grid">
                    <div className="panel">
                        <div className="panel-header compact">
                            <div>
                                <h2>Admin Password</h2>
                                <p>Update the local administrator password used by StockPilot.</p>
                            </div>
                            <ShieldCheck size={20} />
                        </div>
                        <AdminPasswordForm onSave={saveAdminPassword} />
                    </div>
                    <div className="panel">
                        <div className="panel-header compact">
                            <div>
                                <h2>About</h2>
                                <p>Application identity and release information.</p>
                            </div>
                            <Info size={20} />
                        </div>
                        <AboutContent />
                    </div>
                    <div className="panel users-panel">
                        <div className="panel-header compact">
                            <div>
                                <h2>Users Database</h2>
                                <p>Create login users and reset stored database passwords.</p>
                            </div>
                            <Users size={20} />
                        </div>
                        <UserForm onSave={saveUser} />
                        <UserDatabase users={systemUsers} onResetPassword={resetUserPassword} />
                    </div>
                </section>
            )}

            {modal === 'product' && (
                <Modal title="Add Product" onClose={() => setModal(null)}>
                    <ProductForm options={options} onSave={saveProduct} onCancel={() => setModal(null)} />
                </Modal>
            )}

            {modal === 'movement' && (
                <Modal title={movementType === 'issue' ? 'Remove Stock' : 'Receive or Adjust Stock'} onClose={() => setModal(null)}>
                    <MovementForm products={overview.products} options={options} initialProduct={selectedProduct} initialType={movementType} onSave={saveMovement} onCancel={() => setModal(null)} />
                </Modal>
            )}

            {modal === 'supplier' && (
                <Modal title="Add Supplier" onClose={() => setModal(null)}>
                    <SupplierForm onSave={saveSupplier} onCancel={() => setModal(null)} />
                </Modal>
            )}

            {modal === 'location' && (
                <Modal title="Add Location" onClose={() => setModal(null)}>
                    <LocationForm locations={overview.locations} onSave={saveLocation} onCancel={() => setModal(null)} />
                </Modal>
            )}

            {modal === 'customer' && (
                <Modal title="Add Customer" onClose={() => setModal(null)}>
                    <CustomerForm onSave={saveCustomer} onCancel={() => setModal(null)} />
                </Modal>
            )}

            {modal === 'product-settings' && selectedProduct && (
                <Modal title="Edit Product Settings" onClose={() => setModal(null)}>
                    <ProductSettingsForm product={selectedProduct} onSave={saveProductSettings} onCancel={() => setModal(null)} />
                </Modal>
            )}

            {modal === 'about' && (
                <Modal title="About StockPilot" onClose={() => setModal(null)}>
                    <AboutContent />
                </Modal>
            )}
        </main>
    );
}

createRoot(document.getElementById('root')).render(<App />);
