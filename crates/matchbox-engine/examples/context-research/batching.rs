use super::data::Record;

/// Keep complete documents. Similar lengths reduce padding; no truncation or sampling.
pub fn batches(rows: &[Record]) -> Vec<Vec<usize>> {
    let mut order: Vec<_> = (0..rows.len()).collect();
    order.sort_by_key(|&i| rows[i].features.len());
    let mut groups: Vec<Vec<usize>> = Vec::new();
    let mut group = Vec::new();
    for index in order {
        if !group.is_empty() && (group.len() + 1) * rows[index].features.len() > 4096 {
            groups.push(std::mem::take(&mut group));
        }
        group.push(index);
    }
    if !group.is_empty() {
        groups.push(group);
    }
    groups
}
