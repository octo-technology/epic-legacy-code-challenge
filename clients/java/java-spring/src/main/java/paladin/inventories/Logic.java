package paladin.inventories;

import java.util.List;

import org.springframework.stereotype.Component;

import paladin.inventories.gilded_rose.Item;
import paladin.inventories.gilded_rose.Order;
import paladin.inventories.gilded_rose.Shop;

@Component
public class Logic {
	
	public List<Item> applyLogic( Order order ) {
		Shop shop = new Shop( order.getItems().toArray(new Item[0]) ); 
		for (int i = 0; i < order.getDaysElapsed(); i++) {
			shop.updateQuality();
		}
		return shop.getItems();
	}

}
