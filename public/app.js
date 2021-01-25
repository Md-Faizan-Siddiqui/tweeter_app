// var url = "http://localhost:3000"
var url = 'https://twiter-faizan.herokuapp.com'
var socket = io(url);
socket.on('connect', function() {
    console.log("connected")
});

function userSignup() {
    console.log(document.getElementById('name').value)
    axios({
        method: 'post',
        url: url + '/signup',
        data: {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('pass').value,
            phone: document.getElementById('phone').value,
            gender: document.getElementById('gender').value,
        },
        credentials: 'include'
    }).then((response) => {
        if (response.data.status === 200) {
            alert(response.data.message)
            location.href = "./login.html"
        } else {
            alert(response.data.message);
        }
    }).catch((error) => {
        console.log(error);
    });
    return false
}

function login() {
    axios({
        method: 'post',
        url: url + '/login',
        data: {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        },
        credentials: 'include' //true
    }).then((response) => {
        if(response.data.status === 200){
            alert(response.data.message)
            location.href = "./profile.html"
        }
        else{
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });
    return false
}

function getProfile() {
    axios({
        method: 'get',
        url: url + '/profile',
        credentials: 'include',
    }).then((response) => {
        console.log(response);
        document.getElementById('pName').innerHTML = response.data.profile.name
        document.getElementById('pEmail').innerHTML = response.data.profile.email
        document.getElementById('pPhone').innerHTML = response.data.profile.phone
        document.getElementById('img').src = response.data.profile.profilePic
        sessionStorage.setItem("email", response.data.profile.email)
    }, (error) => {
        console.log(error.message);
        location.href = "./login.html"
    });
    return false
}
function forgetPassword() {
    // alert("asd")
    let email = document.getElementById('fEmail').value;
    localStorage.setItem('email', email)
    axios({
        method: 'post',
        url: url + '/forget-password',
        data: {
            email: email,
        },
        credentials: 'include'
    }).then((response) => {
        if(response.data.status === 200){
            alert(response.data.message)
            location.href = "./forget2.html"      
        }
        else{
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });
    return false
}
function forgetPassword2() {
   // console.log(document.getElementById('newPassword').value,)
   // console.log(document.getElementById('otpcode').value,)
    let getEmail = localStorage.getItem('email')
    axios({
        method: 'post',
        url: url + '/forget-password-2',
        data: {
            email: getEmail,
            newPassword: document.getElementById('newPassword').value,
            otp: document.getElementById('otpcode').value,
        },
        credentials: 'include'
    }).then((response) => {
        console.log(response);
        alert(response.data)
        location.href = "./login.html"
    }, (error) => {
        console.log(error);
    });
    return false
}
function logout() {
    axios({
        method: 'post',
        url: url + '/logout',
    }).then((response) => {
        console.log(response);
        location.href = "./login.html"
    }, (error) => {
        console.log(error);
    });
    return false
}
function post() {
    axios({
        method: 'post',
        url: url + '/tweet',
        credentials: 'include',
        data: {
            userName: document.getElementById('pName').innerHTML,
            tweet: document.getElementById('InputPost').value,
        },
    }).then((response) => {
        console.log(response.data.data);
    }, (error) => {
        console.log(error.message);
    });
    document.getElementById('InputPost').value = "";
    return false
}

function getTweets() {
    axios({
        method: 'get',
        url: url + '/getTweets',
        credentials: 'include',
    }).then((response) => {
        let tweets = response.data;
        let html = ""
        tweets.forEach(element => {
            html += `
            <div class="posts">
            <img src="${element.profilePic}" width="50" height="50"/>
            <h4>${element.name}</h4>
            <p class="text-primary">${new Date(element.createdOn).toLocaleTimeString()}</p>
            <p class="noteCard">${element.tweets}</p>
            </div>
            `
        });
        document.getElementById('posts').innerHTML = html;

        let userTweet = response.data
        let userHtml = ""
        let userName = document.getElementById('pName').innerHTML;
        userTweet.forEach(element => {
            if (element.name == userName) {
                userHtml += `
                <div class="posts">
            <img src="${element.profilePic}" width="50" height="50"/>

                <h4>${element.name}</h4>
                <p class="text-primary">${new Date(element.createdOn).toLocaleTimeString()}</p>
                <p class="noteCard">${element.tweets}</p>
                </div>
                `
            }
        });
        document.getElementById('userPosts').innerHTML = userHtml;
    }, (error) => {
        console.log(error.message);
    });
    return false
}
socket.on('NEW_POST', (newPost) => {
    console.log(newPost)
    let tweets = newPost;
    document.getElementById('posts').innerHTML += `
    <div class="posts">
    <img src="${tweets.profilePic} width="50" height="50""/>
    <h4>${tweets.name}</h4>
    <p class="text-primary">${new Date(tweets.createdOn).toLocaleTimeString()}</p>
    <p>${tweets.tweets}</p>
    </div>
    `
    document.getElementById('userPosts').innerHTML += `
    <div class="posts">
    <img src="${tweets.profilePic} width="50" height="50""/>
    <h4>${tweets.name}</h4>
    <p class="text-primary">${new Date(tweets.createdOn).toLocaleTimeString()}</p>
    <p>${tweets.tweets}</p>
    </div>
    `

})

function upload() {

    var fileInput = document.getElementById("fileInput");
    // console.log("fileInput: ", fileInput);
    // console.log("fileInput: ", fileInput.files[0]);

    let formData = new FormData();

    formData.append("myFile", fileInput.files[0]);
    formData.append("email", sessionStorage.getItem('email'));
    formData.append("myDetails",
        JSON.stringify({
            "subject": "Science",
            "year": "2021"
        })
    );

    axios({
            method: 'post',
            url: url + '/upload',
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {

            console.log(`upload Success` + res.data.picture);

        })
        .catch(err => {
            console.log(err);
            alert(err)
        })

    return false;

}

function previewFile() {
    const preview = document.querySelector('img');
    console.log(preview)
    const file = document.querySelector('input[type=file]').files[0];
    const reader = new FileReader();

    reader.addEventListener("load", function() {
        preview.src = reader.result;
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}

document.getElementById('otherPosts').style.display = "none"
function showHome() {
    document.getElementById('otherPosts').style.display = "none"
    document.getElementById('myPosts').style.display = "block"

}

//display profile page using display none or block property
function showProfile() {
    document.getElementById('myPosts').style.display = "none"
    document.getElementById('otherPosts').style.display = "block"
}
