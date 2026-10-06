const fs = require('fs');

const path = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useOrders.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace lines 242-260 cleanly
const beforePart = content.substring(0, content.indexOf('export const useOrders = () => {'));
const hookStart = `export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const initialOrderFormData: Order = {
    id: "",
    clientId: "",
    farmId: "",
    type: "Amostragem de Solo (AP)",
    serviceName: "Amostragem de Solo (AP)",
    productsData: [],
    serviceGroup: "",
    area: "",
    value: "",
    numericValue: 0,
    status: "Pendente",
    payment: "Aguardando",
    executions: [],
    schedules: [],
    payments: [],
    logs: [],
    executedArea: 0,
    paidAmount: 0
  };

  const [formData, setFormData] = useState<Order>({ ...initialOrderFormData });

  const resetOrderForm = () => {
    setEditingOrder(null);
    setFormData({ ...initialOrderFormData });
  };

  const fetchOrders = async () => {`;

const afterIdx = content.indexOf('const fetchOrders = async () => {');
const afterPart = content.substring(afterIdx + 'const fetchOrders = async () => {'.length);

const fullNewContent = beforePart + hookStart + afterPart;
fs.writeFileSync(path, fullNewContent, 'utf8');
console.log('Fixed useOrders.ts cleanly!');
