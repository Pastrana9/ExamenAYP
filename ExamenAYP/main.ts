import { MongoClient } from 'mongodb'

const url = Deno.env.get("MONGO_URL")

if(!url){
  console.log("No existe URL")
  Deno.exit(1)
}

const client = new MongoClient(url);

await client.connect();
  console.log('Connected successfully to server');
  const db = client.db("RedPersonasExamenAYP");
  const personasCollection = db.collection('Personas');

  const handler = async(req: Request): Promise< Response> =>{
    const url = new URL(req.url)
    const method = req.method
    const path = url.pathname
    const searchParams = url.searchParams

    //-----------------------------------------------------------------POST-----------------------------------------------------------------

    if (method === 'POST' && path === '/personas') {
      // Crear una persona
      const { nombre, email, telefono, amigos } = await req.json();
  
      if (!nombre || !email || !telefono) {
        return new Response(JSON.stringify({ error: "Faltan datos." }), { status: 400 });
      }
  
      const exists = await personasCollection.findOne({ $or: [{ email }, { telefono }] });
      if (exists) {
        return new Response(JSON.stringify({ error: "El email o teléfono ya están registrados." }), { status: 400 });
      }
  
      const result = await personasCollection.insertOne({ nombre, email, telefono, amigos });
      const persona = await personasCollection.findOne({ _id: result.insertedId });
  
      return new Response(JSON.stringify({
        message: "Persona creada exitosamente",
        persona: persona
      }), { status: 201 });
  
      //-----------------------------------------------------------------GET-----------------------------------------------------------------

    } else if (method === 'GET' && path === '/personas') {
      // Obtener la lista de personas
      const nombre = searchParams.get('nombre');
      const filter = nombre ? { nombre: { $regex: nombre, $options: "i" } } : {};
      const personas = await personasCollection.find(filter).toArray();
      
      return new Response(JSON.stringify(personas), { status: 200 });
  
    } else if (method === 'GET' && path === '/persona') {
      // Obtener una persona por email
      const email = searchParams.get('email');
      if (!email) {
        return new Response(JSON.stringify({ error: "Email no especificado." }), { status: 400 });
      }
  
      const persona = await personasCollection.findOne({ email });
      if (!persona) {
        return new Response(JSON.stringify({ error: "Persona no encontrada." }), { status: 404 });
      }
  
      return new Response(JSON.stringify(persona), { status: 200 });
  
      //-----------------------------------------------------------------PUT-----------------------------------------------------------------

    } else if (method === 'PUT' && path === '/persona') {
      // Actualizar una persona
      const { email, nombre, telefono, amigos } = await req.json();
  
      if (!email || !nombre || !telefono) {
        return new Response(JSON.stringify({ error: "Faltan datos." }), { status: 400 });
      }
  
      const persona = await personasCollection.findOne({ email });
      if (!persona) {
        return new Response(JSON.stringify({ error: "Usuario no encontrado." }), { status: 404 });
      }
  
      await personasCollection.updateOne(
        { email },
        { $set: { nombre, telefono, amigos } }
      );
  
      const updatedPersona = await personasCollection.findOne({ email });
      return new Response(JSON.stringify({
        message: "Persona actualizada exitosamente",
        persona: updatedPersona
      }), { status: 200 });

      //-----------------------------------------------------------------DELETE-----------------------------------------------------------------

    } else if (method === 'DELETE' && path === '/persona') {
      // Eliminar una persona
      const { email } = await req.json();
  
      if (!email) {
        return new Response(JSON.stringify({ error: "Falta email." }), { status: 400 });
      }
  
      const persona = await personasCollection.findOne({ email });
      if (!persona) {
        return new Response(JSON.stringify({ error: "Usuario no encontrado." }), { status: 404 });
      }
  
      await personasCollection.deleteOne({ email });
      return new Response(JSON.stringify({ message: "Persona eliminada exitosamente." }), { status: 200 });
    }

  
    return new Response("Endpoint not found", {status:4000})

  }

  Deno.serve({port:3000}, handler)

