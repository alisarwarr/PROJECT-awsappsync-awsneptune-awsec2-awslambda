const gremlin = require('gremlin');


const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;
const uri = process.env.READ_ADDRESS;


async function listPosts() {
    let dc = new DriverRemoteConnection(`wss://${uri}/gremlin`, {});
    const graph = new Graph();
    const g = graph.traversal().withRemote(dc);

    try {
        let data = await g.V().hasLabel('posts').toList();
        let posts = Array();
  
        for(const v of data) {                                         //for each vertex
            const _properties = await g.V(v.id).properties().toList(); //for each vertex's id

            let post = _properties.reduce((acc, next) => {             //acc & index's value
              acc[next.label] = next.value;
              return acc;
            }, {});
  
            post.id = v.id;
            posts.push(post);
        }
                  
        dc.close();
        return posts;
    }
    catch (err) {
        console.log('ERROR', err);
        return null;
    }
}

export default listPosts;