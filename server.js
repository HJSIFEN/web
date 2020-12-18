var fs = require('fs');
var path = require('path');
var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var mime = require('mime');
var ejs = require('ejs');
var request = require('url')
const multer = require('multer');

const { stringify } = require('querystring');
const { title } = require('process');
const { response } = require('express');
const { applyEachSeries } = require('async');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'web2020',
	password : 'web2020',
	database : 'web'
});




var app = express();

app.use(session({	
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

function restrict(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.sendFile(path.join(__dirname + '/my/login.html'));
  }
}

app.use('/', function(request, response, next) {
	if ( request.session.loggedin == true || request.url == "/login" || request.url == "/register" ) {
    next();
	}
	else {
    response.sendFile(path.join(__dirname + '/my/login.html'));
	}
});

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/my/home.html'));
});

app.get('/login', function(request, response) {
	response.sendFile(path.join(__dirname + '/my/login.html'));
});

app.post('/login', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
				response.end();
			} else {
				//response.send('Incorrect Username and/or Password!');
				response.sendFile(path.join(__dirname + '/my/loginerror.html'));
			}
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

// app.post('/toBasket', function(request, response){
// 	var username = request.session.username;
// 	var price = request.body.price;
// 	var product = request.body.product;
// 	var cnt = request.body.cnt;
// 	var size = request.body.size;

// 	connection.query('INSERT INTO basket(id, product, price, cnt, date, size) values('+"'"+username+ "'"+','+"'"+product+"'"+',' +price + ','+cnt+', sysdate(),'+ "'"+size+"'"+')',
// 	function(err, data){
// 		if(err)
// 			console.log(err);
// 		else
// 			console.log(data);
// 	});
// })

app.get('/register', function(request, response) {
	response.sendFile(path.join(__dirname + '/my/register.html'));
});


const upload = multer({
	storage: multer.diskStorage({
	  destination: function (req, file, cb) {
		cb(null, 'image/');
	  },
	  filename: function (req, file, cb) {
		cb(null, file.originalname);
	  }
	}),
  });	

  app.post('/upload', upload.single('img'), (req, res) => {
	console.log(req.file); 
	connection.query("INSERT INTO products(name, price, type, p_code, sub_type) values(?,?,?,?,?)",[
		req.body.name, req.body.price,req.body.type, req.body.p_code, req.body.sub_type
	], );
  res.redirect('/admin/edit');
  });	



app.post('/register', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	var password2 = request.body.password2;
	var email = request.body.email;
	var phone = request.body.phone;

	console.log(username, password, email);	
	if (username && password && email) {
		connection.query('SELECT * FROM user WHERE username = ? AND password = ? AND email = ?', [username, password, email], function(error, results, fields) {
			if (error) throw error;
			if (results.length <= 0) {
        connection.query('INSERT INTO user (username, password, email, phone, address,date) VALUES(?,?,?,?,?,sysdate())', [username, password, email,phone, request.body.address],
        	    function (error, data) {
                if (error)
                  console.log(error);
                else
                  console.log(data);
        });
			  response.send(username + ' Registered Successfully!<br><a href="/home">Home</a>');
			} else {
				response.send(username + ' Already exists!<br><a href="/home">Home</a>');
			}
			response.end();
		});
	} else {
		response.send('Please enter User Information!');
		response.end();
	}
});



app.get('/logout', function(request, response) {
  request.session.loggedin = false;
	response.send('<center><H1>Logged Out.</H1><H1><a href="/">Goto Home</a></H1></center>');
	response.end();
});

app.get('/home/messages', function (request, response) {
    response.send(messages);
});

app.post('/home/messages', function (request, response) {
    // 변수를 선언합니다.
    var name = request.body.name;
    var content = request.body.content;
    var message = {
        name: name,
        content: content
	};
	if(name == top)
    // 데이터를 추가합니다.
    messages.push(message);
    // 응답합니다.
    response.send({
        message: '데이터를 추가했습니다.',
        data: message
    });
});

app.get('/home', restrict,
function (request, response) {
	fs.readFile(__dirname + '/my/home.html', 'utf8', function (error, data) {
        // �����ͺ��̽� ������ �����մϴ�.
        connection.query("SELECT * FROM products", function (error, results) {
            // �����մϴ�.
            response.send(ejs.render(data, {
                data: results
            }));
		});
    });
}, function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/my/home.html'));
	} else {
		response.send('Please login to view this page!');
		response.end();
	}});

app.get('/item/:id', function (request, response) {
	fs.readFile(__dirname + '/my/type.html', 'utf8', function (error, data) {
		connection.query('select * from p_stock s, products p where p.p_code = s.p_code and p.p_code = ?', [
			request.param('id')
		], function (error, result) {
				// �����մϴ�.
			response.send(ejs.render(data, {
				data: result[0],
				size: result
			}));
		});
	});
});

app.post('/item/:id', function (request, response) {
	var username = request.session.username;
	var price = request.body.price;
	var product = request.body.product;
	var cnt = request.body.cnt;
	var size = request.body.size;
	var p_code = request.body.p_code;
	connection.query('INSERT INTO basket(id, product, price, cnt, date, size, p_code) values('+"'"+username+ "'"+','+"'"+product+"'"+',' +price + ','+cnt+', sysdate(),'+ "'"+size+"',"+ "'"+ p_code+"'"+')',
	function(err, data){
		if(err)
			console.log(err);
		else
			console.log(data);

		response.redirect('/item/'+request.param('id'));
	});
});

app.get('/test2', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/my/test2.html'));
	} else {
		response.send('Please login to view this page!');	
		response.end();
	}
});

// app.get('/BASKET', function(request, response){
// 	response.sendFile(path.join(__dirname + '/my/4.html'));
// 	response.send
// });

app.get('/BASKET', function (request, response) {
	// ������ �н��ϴ�.
	fs.readFile(__dirname + '/my/basket.html', 'utf8', function (error, data) {
		// �����ͺ��̽� ������ �����մϴ�.
		connection.query('select * from basket where id=?', [
			request.session.username
		], function (error, result) {
				// �����մϴ�.
			response.send(ejs.render(data, {
				data: result
			}));
		});
	});
});

app.post('/BASKET/delteList', function(request, response){
	connection.query('select * from basket where id=?', [request.session.username],
	function(error, results){
		var date = results[request.body.index].date;
		var product = results[request.body.index].product;
		connection.query('delete from basket where date=? and product=?', [date, product],
		function(error){
			response.redirect('/BASKET')
		});
	})
})

var sub_id;
app.get('/sub/:id', function (request, response) {
	sub_id = request.param('id');
	fs.readFile(__dirname + '/my/type.html', 'utf8', function (error, data) {
		// �����ͺ��̽� ������ �����մϴ�.
		connection.query('SELECT * FROM products WHERE type = ?', [
			request.param('id')
		], function (error, results) {
			// �����մϴ�.
			response.send(ejs.render(data, {
				data: results,
				title:request.param('id')
			}));
		});
	});
});

app.get('/sub', function (request, response) {
	// ������ �н��ϴ�.
	response.send(sub_id);
});
var messages = [];
//var image_data= new Array();
//이미지 보내기
app.get('/image/:id', function(request, response){
	response.sendFile(path.join(__dirname + '/image/'+ request.param('id')));
});

// app.get('/imagetest/:id', function(request, response){
// 	console.log('log test :' + image_data[[request.param('id')]]);
// 	response.sendFile(path.join(__dirname + '/image/'+ image_data[request.param('id')]));
// });
app.post('/imagetest/:id', function(request, response){
	var type = request.body.data;
	console.log(type);
	var sql = "select * from products where type='"+ type + "' order by " + request.param('id') +" " + request.body.sort;
	console.log(sql);
	var datas = new Array();
	var names = new Array();
	var pcodes = new Array();
	connection.query(sql, function(err, rows, fields){
		if (err){
			console.log(err);
		} else{
			for (var i=0; i<rows.length; i++){
				datas.push(rows[i].p_code+".jpg");
				names.push(rows[i].name);
				pcodes.push(rows[i].p_code);
			}
			response.json({
				images : datas,
				names : names,
				codes : pcodes
			})
		} 
	});
	  
});

app.get('/admin', function(request, response){
	response.sendFile(path.join(__dirname + '/my/manage.html'));

});

app.get('/admin/add', function(request, response){
	response.sendFile(path.join(__dirname + '/my/add_user.html'));

});

app.get('/admin/edit', function(request, response){
	fs.readFile(__dirname + '/my/item_list.html', 'utf8', function (error, data) {
        // �����ͺ��̽� ������ �����մϴ�.
        connection.query('SELECT * FROM products', function (error, results) {
            // �����մϴ�.
            response.send(ejs.render(data, {
				data: results
            }));
        });
    });

});

app.get('/isAdmin', function(request, response){
	connection.query('select * from user where username=?',[request.session.username],
	function(error, result){
		if(result[0].perm=='admin'){response.send('admin');}
	});
})

app.get('/edit/:id', function(request, response){
	fs.readFile(__dirname + '/my/edit_item.html', 'utf8', function (error, data) {
        // �����ͺ��̽� ������ �����մϴ�.
		connection.query('SELECT * FROM products where id=?',[request.param('id')], 
		function (error, result) {
            // �����մϴ�.
            response.send(ejs.render(data, {
				data: result[0]
            }));
        });
    });
});

app.post('/edit/:id',upload.single('img'), function(request, response){
	connection.query("update products set name=?,type=?	, price=?, score=?, sell_cnt=? where id=?",[
		request.body.name,request.body.type, Number(request.body.price), Number(request.body.score), Number(request.body.cnt), request.param('id')
	], function(err, rows){
		if(err) console.log("err : "+err);
		console.log(rows);
		response.redirect('/admin/edit');
	});
});

app.get('/addsize/:id', function(request, response){
	fs.readFile(__dirname + '/my/add_size.html', 'utf8', function (error, data) {
        // �����ͺ��̽� ������ �����մϴ�.
		connection.query('SELECT * FROM products where p_code=?',[request.param('id')], 
		function (error, result) {
            // �����մϴ�.
            response.send(ejs.render(data, {
				data: result[0]
            }));
        });
    });
});

app.post('/addsize/:id', function(request, response){
	var size = request.body.size;
	connection.query("select * from p_stock where p_code=? and p_size=?",[
		request.param('id'), size
	], function(err, rows){
		if(rows.length >= 1){
			connection.query("update p_stock set p_size=?, p_cnt=? where p_code=? and p_size=?",[
				size,Number(request.body.cnt), request.param('id'), request.body.size
			], function(err, rows){
				if(err) console.log("err : "+err);
				console.log(rows);
				response.redirect('/admin/edit');
			});
		}
		else{
			connection.query("insert into p_stock set p_size=?, p_cnt=?, p_code=?",[
				size, Number(request.body.cnt), request.param('id')
			], function(err, rows){
				if(err) console.log("err : "+err);
				console.log(rows);
				response.redirect('/admin/edit');
			});	
		}
	})
});

app.post('/admin/delete', function(request, response){
	connection.query('delete from products where id=?', [request.body.id],
	function(error, results){
		console.log(error);
		response.redirect('/admin/edit');
	})
});

app.get('/user', function(request, response){
	fs.readFile(__dirname + '/my/user_list.html', 'utf8', function (error, data) {
        // �����ͺ��̽� ������ �����մϴ�.
		connection.query('select * from user', 
		function (error, results) {
            // �����մϴ�.
            response.send(ejs.render(data, {
				data: results
            }));
        });
    });
});

app.post('/user/delete', function(request, response){
	connection.query('delete from user where id=?', [request.body.id],
	function(error, results){
		console.log(error);
		response.redirect('/user');
	})
});

app.get('/user/edit/:id', function(request, response){
	fs.readFile(__dirname + '/my/edit_user.html', 'utf8', function (error, data) {
        // �����ͺ��̽� ������ �����մϴ�.
		connection.query('select * from user where id=?',[request.param('id')], 
		function (error, result) {
            // �����մϴ�.
            response.send(ejs.render(data, {
				data: result[0]
            }));
        });
    });
});

app.post('/user/edit/:id', function(request, response){
	connection.query("update products set name=?,type=?	, price=?, score=?, sell_cnt=? where id=?",[
		request.body.name,request.body.type, Number(request.body.price), Number(request.body.score), Number(request.body.cnt), request.param('id')
	], function(err, rows){
		if(err) console.log("err : "+err);
		console.log(rows);
		response.redirect('/admin/edit');
	});
});

app.post('/edit_user', function(request, response){
	connection.query("update user set password=?, perm=?, email=?, address=?, phone=? where id=?",[
		request.body.password, request.body.perm, request.body.email,  request.body.address, request.body.phone, request.body.id
	], function(err, rows){
		if(err) console.log("err : "+err);
		console.log(rows);
		response.redirect('/user');
	});
});;

// Board
app.get('/board', function (request, response) {
    // ������ �н��ϴ�.
    fs.readFile(__dirname + '/board/list.html', 'utf8', function (error, data) {
        // �����ͺ��̽� ������ �����մϴ�.
        connection.query('SELECT * FROM products', function (error, results) {
            // �����մϴ�.
            response.send(ejs.render(data, {
				data: results
            }));
        });
    });
});
app.get('/delete/:id', function (request, response) {
    // �����ͺ��̽� ������ �����մϴ�.
    connection.query('DELETE FROM products WHERE id=?', [request.param('id')], function () {
        // �����մϴ�.
        response.redirect('/board');
    });
});
app.get('/insert', function (request, response) {
    // ������ �н��ϴ�.
    fs.readFile(__dirname + '/board/insert.html', 'utf8', function (error, data) {
        // �����մϴ�.
        response.send(data);
    });
});
app.post('/insert', function (request, response) {
    // ������ �����մϴ�.
    var body = request.body;

    // �����ͺ��̽� ������ �����մϴ�.
    connection.query('INSERT INTO products (name, modelnumber, series) VALUES (?, ?, ?)', [
        body.name, body.modelnumber, body.series
    ], function () {
        // �����մϴ�.
        response.redirect('/board');
    });
});

app.post('/insert', function (request, response) {
    // ������ �����մϴ�.
    var body = request.body;

    // �����ͺ��̽� ������ �����մϴ�.
    connection.query('update products set score=? where p_code = ?', [
        body.score, body.p_code
    ], );
});

app.get('/add_product', function(request, response){
	response.sendFile(path.join(__dirname + '/my/add_item.html'));

})

app.get('/done', function(request, response){
	fs.readFile(__dirname + '/my/13.html', 'utf8', function (error, data) {
        // �����մϴ�.
    });

})

app.get('/buy_item', function(request, response){
	var sum_cnt = 0;
	var sum_price = 0;

	connection.query('select * from basket where id=?',[request.session.username],
	function(err, rows){
		if(err) console.log("err : "+err);
		for(var i of rows){
			sum_cnt += i.cnt;
			sum_price += i.price*i.cnt;
		}
		
		connection.query('select * from user where username=?',[request.session.username],
		function(err, result){
			if(err) console.log("err : "+err);
			
			sum_cnt += result[0].buy_cnt;
			sum_price += result[0].buy_amount;
			connection.query('update user set buy_cnt=?, buy_amount=? where username=?',[sum_cnt, sum_price, request.session.username],
			function(err, result){
				if(err) console.log("err : "+err);
		
				connection.query('delete from basket where id=?',[request.session.username]);
			});
			
		});
		response.redirect('/buy_item');

	});
	

})
// app.get('/buy_item', function(request, response){
// 	connection.query('Call buy_item('+ request.session.username+')', function(err, rows){
// 		if(err) { throw err;}
// 		response.redirect('/done');
// 	});
// })

app.post('/add_user', function (request, response) {
    // ������ �����մϴ�.
    var body = request.body;

    // �����ͺ��̽� ������ �����մϴ�.
    connection.query('Insert into user(username, password, perm, email, address, phone, date) values(?, ?, ?, ?, ?,?, sysdate())', [
		body.username, body.password, body.perm, body.email, body.address, body.phone
	], function () {
        // �����մϴ�.
        response.redirect('/user');
    });
});

app.listen(3000, function () {
    console.log('Server Running at http://127.0.0.1:3000');
});