const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(()=>{
    return sequelize.sync();
});

beforeEach(()=>{
    return User.destroy({ truncate: true });
});

describe('User Registration', ()=>{

    const postValidUser = ()=>{
        
        return request(app)
            .post('/api/1.0/users')
            .send({
            
                username: 'user1',
                email: 'user1@mail.com',
                password: 'P4ssword'
    
            })
        ;

    };
    it('returns 200 OK when signup request is valid', (done)=>{

        postValidUser()
            .then((response)=>{
                expect(response.status).toBe(200);
                done();
            })
        ;
    
    });
    it('returns success message when signup requst is valid', (done)=>{
    
        postValidUser()
            .then((response)=>{
                expect(response.body.message).toBe('User created');
                done();
            })
        ;
    
    });
    it('saves the user to database', (done)=>{

        postValidUser()
            .then(()=>{

                User.findAll().then((userList)=>{
                    expect(userList.length).toBe(1);
                    done();
                });
                
            })
        ;

    });
    it('saves the username and email to database', (done)=>{

        postValidUser()
            .then(()=>{

                User.findAll().then((userList)=>{
                    const savedUser = userList[0];
                    expect(savedUser.username).toBe('user1');
                    expect(savedUser.email).toBe('user1@mail.com');
                    done();
                });

            })
        ;

    });
    it('hashes the password in database', (done)=>{

        postValidUser()
            .then(()=>{

                User.findAll().then((userList)=>{
                    const savedUser = userList[0];
                    expect(savedUser.password).not.toBe('P4ssword');
                    done();
                });

            })
        ;

    });

});










