package paladin.inventories.gilded_rose;

import java.util.List;
import java.util.stream.Collectors;

public class Order {
	
	List<Item> items;
	int daysElapsed;
	
	public List<Item> getItems() {
		return items;
	}
	public void setItems(List<Item> items) {
		this.items = items;
	}
	public int getDaysElapsed() {
		return daysElapsed;
	}
	public void setDaysElapsed(int daysElapsed) {
		this.daysElapsed = daysElapsed;
	}

	@Override
	public String toString() {
		String items =
			this.items == null ? "null" : String.join(",\n", 
					this.items.stream()
					.map( item -> item.toString() )
					.collect( Collectors.toList() )
				);
		return String.format("Order{\nitems: %s,\ndaysElapsed: %d\n}", items, daysElapsed);
	}
}
