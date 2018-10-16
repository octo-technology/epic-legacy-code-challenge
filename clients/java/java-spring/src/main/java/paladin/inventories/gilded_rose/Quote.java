package paladin.inventories.gilded_rose;

import java.util.List;
import java.util.stream.Collectors;

public class Quote {
	
	List<Item> items;

	public List<Item> getItems() {
		return items;
	}

	public void setItems(List<Item> items) {
		this.items = items;
	}
	
	@Override
	public String toString() {
		String items =
				this.items == null ? "null" : String.join(",\n", 
						this.items.stream()
						.map( item -> item.toString() )
						.collect( Collectors.toList() )
					);
		return String.format("Quote: {\n%s\n}", items);
	}

}
