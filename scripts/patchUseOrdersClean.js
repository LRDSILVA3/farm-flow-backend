const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useOrders.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove supabase import
content = content.replace('import { supabase } from "@/integrations/supabase/client";\n', '');

// 2. Clean fetchOrders
const oldFetch = `    try {
      try {
        const backendOrders = await api.get<any[]>('/orders');
        if (Array.isArray(backendOrders)) {
          setOrders(backendOrders.map(mapFromDB));
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to Supabase
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data || []).map(mapFromDB));
    } catch (error: any) {`;

const newFetch = `    try {
      const backendOrders = await api.get<any[]>('/orders');
      if (Array.isArray(backendOrders)) {
        setOrders(backendOrders.map(mapFromDB));
      }
    } catch (error: any) {`;

content = content.replace(oldFetch, newFetch);

// 3. Clean addOrder
const oldAddOrderEnd = `        await fetchOrders();
        toast({
          title: "Pedido criado",
          description: "O pedido foi criado com sucesso."
        });
        return created;
      } catch {
        // Fallback to Supabase
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          client_id: order.clientId || null,
          farm_id: order.farmId || null,
          type: order.type || "Serviço",
          service_name: sName,
          products_data: order.productsData || [],
          service_group: order.serviceGroup || null,
          area: numArea,
          value: numVal,
          status: order.status || "Pendente",
          payment: order.payment || "Aguardando"
        })
        .select()
        .single();

      if (error) throw error;
      await fetchOrders();
      toast({
        title: "Pedido criado",
        description: "O pedido foi criado com sucesso."
      });
      return data;
    } catch (error: any) {`;

const newAddOrderEnd = `        await fetchOrders();
        toast({
          title: "Pedido criado",
          description: "O pedido foi criado com sucesso."
        });
        return created;
      } catch (backendErr: any) {
        throw backendErr;
      }
    } catch (error: any) {`;

content = content.replace(oldAddOrderEnd, newAddOrderEnd);

// 4. Clean updateOrder
const oldUpdateEnd = `        await fetchOrders();
        toast({
          title: "Pedido atualizado",
          description: "O pedido foi atualizado com sucesso."
        });
        return updated;
      } catch {
        // Fallback to Supabase
      }

      const { error } = await supabase
        .from("orders")
        .update({
          client_id: order.clientId || null,
          farm_id: order.farmId || null,
          type: order.type || "Serviço",
          service_name: sName,
          products_data: order.productsData || [],
          service_group: order.serviceGroup || null,
          area: numArea,
          value: numVal,
          status: order.status || "Pendente",
          payment: order.payment || "Aguardando"
        })
        .eq("id", order.id);

      if (error) throw error;
      await fetchOrders();
      toast({
        title: "Pedido atualizado",
        description: "O pedido foi atualizado com sucesso."
      });
    } catch (error: any) {`;

const newUpdateEnd = `        await fetchOrders();
        toast({
          title: "Pedido atualizado",
          description: "O pedido foi atualizado com sucesso."
        });
        return updated;
      } catch (backendErr: any) {
        throw backendErr;
      }
    } catch (error: any) {`;

content = content.replace(oldUpdateEnd, newUpdateEnd);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('✅ useOrders.ts cleaned: 100% backend REST API, zero Supabase code!');
