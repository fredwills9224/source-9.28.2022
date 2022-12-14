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

const validUser = {
    username: 'user1',
    email: 'user1@mail.com',
    password: 'P4ssword'
};
const postUser = (user = validUser)=>{
        
    return request(app)
        .post('/api/1.0/users')
        .send(user)
    ;

};
describe('User Registration', ()=>{

    it('returns 200 OK when signup request is valid', async ()=>{

        const response = await postUser();    
        expect(response.status).toBe(200);
    
    });
    it('returns success message when signup requst is valid', async ()=>{
    
        const response = await postUser();
        expect(response.body.message).toBe('User created');
    
    });
    it('saves the user to database', async ()=>{

        await postUser();
        const userList = await User.findAll();
        expect(userList.length).toBe(1);

    });
    it('saves the username and email to database', async ()=>{

        await postUser();
        const userList = await User.findAll();
        const savedUser = userList[0];
        expect(savedUser.username).toBe('user1');
        expect(savedUser.email).toBe('user1@mail.com');
                
    });
    it('hashes the password in database', async ()=>{

        await postUser();
        const userList = await User.findAll();
        const savedUser = userList[0];
        expect(savedUser.password).not.toBe('P4ssword');
                    
    });
    it('returns 400 when username is null', async()=>{

        const response = await postUser({
            username: null,
            email: 'user1@mail.com',
            password: 'P4ssword'
        });
        expect(response.status).toBe(400);

    });
    it('returns validationErrors field in response body when validation error occurs', 
        async ()=>{

        const response = await postUser({
            username: null,
            email: 'user1@mail.com',
            password: 'P4ssword'
        });
        const body = response.body;
        expect(body.validationErrors).not.toBeUndefined();

    });    
    it('returns errors for both when username and email is null', async ()=>{

        const response = await postUser({
            username: null,
            email: null,
            password: 'P4ssword'
        });
        const body = response.body;
        expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);

    });

    const username_null = 'Username cannot be null';
    const username_size = 'Must have min 4 and max 32 characters';
    const email_null = 'E-mail cannot be null';
    const email_invalid = 'E-mail is not valid';
    const password_null = 'Password cannot be null';
    const password_size = 'Password must be at least 6 characters';
    const password_pattern = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
    const email_inuse = 'E-mail in use';
    it.each`
            field         | value             | expectedMessage
            ${'username'} | ${null}           | ${username_null}
            ${'username'} | ${'usr'}          | ${username_size}
            ${'username'} | ${'a'.repeat(33)} | ${username_size}
            ${'email'}    | ${null}           | ${email_null}
            ${'email'}    | ${'mail.com'}     | ${email_invalid}
            ${'email'}    | ${'user.mail.com'}| ${email_invalid}
            ${'email'}    | ${'user@mail'}    | ${email_invalid}
            ${'password'} | ${null}           | ${password_null}
            ${'password'} | ${'P4ssw'}        | ${password_size}
            ${'password'} | ${'alllowercase'} | ${password_pattern}
            ${'password'} | ${'ALLUPPERCASE'} | ${password_pattern}
            ${'password'} | ${'1234567890'}   | ${password_pattern}
            ${'password'} | ${'lowerandUPPER'}| ${password_pattern}
            ${'password'} | ${'lower4nd5678'} | ${password_pattern}
            ${'password'} | ${'UPPER4444'}    | ${password_pattern}
        `('returns $expectedMessage when $field is $value', async ({field, expectedMessage, value})=>{

        const user = {
            username: 'user1',
            email: 'user1@mail.com',
            password: 'P4ssword'
        };
        user[field] = value;
        const response = await postUser(user);
        const body = response.body;
        expect(body.validationErrors[field]).toBe(expectedMessage);

    });
    it(`returns ${email_inuse} when same email is already in use`, async ()=>{

        await User.create({ ...validUser });
        const response = await postUser();
        expect(response.body.validationErrors.email).toBe(email_inuse);

    });
    it('returns errors for both username is null and email is in use', async ()=>{

        await User.create({ ...validUser });
        const response = await postUser({
            username: null,
            email: validUser.email,
            password: 'P4ssword'
        });
        const body = response.body;
        expect(Object.keys(body.validationErrors)).toEqual([ 'username', 'email' ]);

    });

});

describe('Internationalization', ()=>{

    const postUser = (user = validUser)=>{
        return request(app).post('/api/1.0/users')
            .set('Accept-Language', 'tr')
            .send(user)
        ;
    };
    const username_null = 'Kullanici adi bos olamaz';
    const username_size = 'En az 4 en fazla 32 karakter olmali';
    const email_null = 'E-Posta bos olamaz';
    const email_invalid = 'E-Posta gecerli degil';
    const password_null = 'Sifre bos olamaz';
    const password_size = 'Sifre en az 6 karakter olmali';
    const password_pattern = 'Sifrede en az 1 buyuk, 1 kucuk harf ve 1 sayi bulunmalidir';
    const email_inuse = 'Bu E-Posta kullaniliyor';
    it.each`
            field         | value             | expectedMessage
            ${'username'} | ${null}           | ${username_null}
            ${'username'} | ${'usr'}          | ${username_size}
            ${'username'} | ${'a'.repeat(33)} | ${username_size}
            ${'email'}    | ${null}           | ${email_null}
            ${'email'}    | ${'mail.com'}     | ${email_invalid}
            ${'email'}    | ${'user.mail.com'}| ${email_invalid}
            ${'email'}    | ${'user@mail'}    | ${email_invalid}
            ${'password'} | ${null}           | ${password_null}
            ${'password'} | ${'P4ssw'}        | ${password_size}
            ${'password'} | ${'alllowercase'} | ${password_pattern}
            ${'password'} | ${'ALLUPPERCASE'} | ${password_pattern}
            ${'password'} | ${'1234567890'}   | ${password_pattern}
            ${'password'} | ${'lowerandUPPER'}| ${password_pattern}
            ${'password'} | ${'lower4nd5678'} | ${password_pattern}
            ${'password'} | ${'UPPER4444'}    | ${password_pattern}
        `('returns $expectedMessage when $field is $value when language is set as turkish', async ({field, expectedMessage, value})=>{

        const user = {
            username: 'user1',
            email: 'user1@mail.com',
            password: 'P4ssword'
        };
        user[field] = value;
        const response = await postUser(user);
        const body = response.body;
        expect(body.validationErrors[field]).toBe(expectedMessage);

    });
    it(`returns ${email_inuse} when same email is already in use when language is set as turkish`, async ()=>{

        await User.create({ ...validUser });
        const response = await postUser();
        expect(response.body.validationErrors.email).toBe(email_inuse);

    });    

});
