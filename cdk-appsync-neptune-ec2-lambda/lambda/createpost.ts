const gremlin = require('gremlin');
import Post from './type/Post';


const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;
const uri = process.env.WRITE_ADDRESS;


async function createPost(post: Post) {
    let dc = new DriverRemoteConnection(`wss://${uri}/gremlin`, {});
    const graph = new Graph();
    const g = graph.traversal().withRemote(dc);

    await g.addV('posts').property('title', post.title).property('content', post.content).next();
    dc.close();

    return post;
}

export default createPost;