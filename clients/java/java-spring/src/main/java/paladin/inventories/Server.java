package paladin.inventories;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import paladin.inventories.gilded_rose.Order;
import paladin.inventories.gilded_rose.Quote;

@RestController
public class Server {
	
	private final static Logger log = LoggerFactory.getLogger(Server.class);
	
	@Autowired
	Logic logic;

	@PostMapping("/order")
	public ResponseEntity<Quote> order(@RequestBody Order request) {
		log.info("POST /order {}", request);
		Quote quote = new Quote();
		quote.setItems( logic.applyLogic(request) );
		log.info("reply ==> {}", quote);
		return new ResponseEntity<>( quote, HttpStatus.OK );
		// return new ResponseEntity<>(HttpStatus.NOT_FOUND);
	}
	
	@PostMapping("/feedback")
	public String feedback(@RequestBody Feedback req) {
		if ( "ERROR".equals(req.type) ) {
			log.error( req.content );
		} else {
			log.info( req.content );
		}
		
		return "Ok";
	}
	
	@GetMapping("/ping")
	public String ping() {
		return "pong";
	}
	
	
	static class Feedback {
		public String type;
		public String content;
	}
}
